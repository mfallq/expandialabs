// Deploy site/ to Loopia over FTPS using the system curl (no npm dependencies).
//
//   node scripts/deploy.mjs --list [path]   list a remote folder (default: the target)
//   node scripts/deploy.mjs --dry-run       show what would be uploaded
//   node scripts/deploy.mjs                 upload everything in site/
//
// Reads FTP_* from .env. Uploads only, never deletes. Refuses any target that
// is not <something>/expandialabs.com/public_html, so another domain on the
// same Loopia account (e.g. gotteftermaten.se) can never be touched.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const REQUIRED_SUFFIX = 'expandialabs.com/public_html';

process.loadEnvFile(join(ROOT, '.env'));
const { FTP_HOST, FTP_PORT = '21', FTP_USER, FTP_PASSWORD, FTP_SECURE = 'true', FTP_REMOTE_DIR = '' } = process.env;

const fail = (message) => { console.error(`deploy: ${message}`); process.exit(1); };
if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) fail('FTP_HOST, FTP_USER and FTP_PASSWORD must be set in .env');
if (FTP_SECURE !== 'true') fail('FTP_SECURE must be true: credentials are only sent over TLS');

// Remote paths are relative to the FTP login folder (Loopia: the account root)
const remoteDir = FTP_REMOTE_DIR.replace(/^\/+|\/+$/g, '');
if (!remoteDir.endsWith(REQUIRED_SUFFIX)) fail(`FTP_REMOTE_DIR must end with /${REQUIRED_SUFFIX} (got "${FTP_REMOTE_DIR}")`);

const args = process.argv.slice(2);
const mode = args.includes('--list') ? 'list' : args.includes('--dry-run') ? 'dry' : 'upload';

const encodePath = (path) => path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
const url = (path) => `ftp://${FTP_HOST}:${FTP_PORT}/${encodePath(path)}`;

// Credentials go in a temporary netrc file, never on the command line or in logs
const tmp = mkdtempSync(join(tmpdir(), 'deploy-'));
const netrc = join(tmp, 'netrc');
writeFileSync(netrc, `machine ${FTP_HOST} login ${FTP_USER} password ${FTP_PASSWORD}\n`, { mode: 0o600 });

const curl = (extra) => {
  const result = spawnSync('curl', ['--silent', '--show-error', '--ssl-reqd', '--netrc-file', netrc,
    '--connect-timeout', '20', '--retry', '2', ...extra], { encoding: 'utf8' });
  return { ok: result.status === 0, out: result.stdout, err: (result.stderr || '').trim() };
};

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  if (name === '.DS_Store' || name === 'Thumbs.db') return [];
  return statSync(full).isDirectory() ? walk(full) : [full];
});

try {
  if (mode === 'list') {
    const target = args[args.indexOf('--list') + 1];
    const path = target && !target.startsWith('--') ? target : remoteDir;
    const res = curl([`${url(path)}/`]);
    if (!res.ok) fail(`could not list "${path}": ${res.err}`);
    console.log(`Remote listing of /${path}:\n${res.out}`);
  } else {
    const files = walk(SITE).map((full) => ({ full, rel: relative(SITE, full).split(sep).join('/'), size: statSync(full).size }));
    const total = files.reduce((sum, f) => sum + f.size, 0);
    console.log(`${files.length} files, ${(total / 1024).toFixed(0)} KB -> ftps://${FTP_HOST}/${remoteDir}/`);

    const probe = curl([`${url(remoteDir)}/`, '--list-only']);
    if (!probe.ok) fail(`target folder not reachable: ${probe.err}`);

    if (mode === 'dry') {
      files.forEach((f) => console.log(`  would upload  ${f.rel}  (${(f.size / 1024).toFixed(1)} KB)`));
      console.log(`\nCurrently in /${remoteDir}:\n${probe.out || '  (empty)'}`);
    } else {
      for (const f of files) {
        const res = curl(['--ftp-create-dirs', '-T', f.full, url(`${remoteDir}/${f.rel}`)]);
        if (!res.ok) fail(`upload failed for ${f.rel}: ${res.err}`);
        console.log(`  uploaded  ${f.rel}`);
      }
      console.log('Done.');
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
