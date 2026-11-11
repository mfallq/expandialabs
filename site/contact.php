<?php
/* Expandia Labs: contact form handler.
   Takes the form on index.html and mails it on. The address it goes to is
   read from contact.config.php, which is git-ignored and only exists on the
   server, so it never appears on the site or in the public repository.
   Answers JSON to the page's script, or a small page when JS is off. */

declare(strict_types=1);

header('X-Robots-Tag: noindex');

$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, int $status, string $message, array $errors = []): void
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => (object) $errors]);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $title = $ok ? 'Thanks, your message is on its way' : 'Your message wasn’t sent';
    $detail = $errors ? implode(' ', $errors) : $message;
    $link = $ok ? 'Back to the site' : 'Back to the form';
    $href = $ok ? '/' : '/#contact';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . htmlspecialchars($title) . ' | Expandia Labs</title>'
        . '<link rel="icon" href="/assets/brand/favicon-32.svg" type="image/svg+xml">'
        . '<link rel="stylesheet" href="/assets/css/styles.css?v=20261111a"></head>'
        . '<body class="section--linen-2"><main class="contact-reply"><div class="contact-card">'
        . '<h1 class="heading-5">' . htmlspecialchars($title) . '</h1>'
        . '<p class="body-3">' . htmlspecialchars($detail) . '</p>'
        . '<a class="button button--ink button--large button-lg" href="' . $href . '">' . $link . '</a>'
        . '</div></main></body></html>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 405, 'Please use the contact form on the site.');
}

$config = is_file(__DIR__ . '/contact.config.php') ? require __DIR__ . '/contact.config.php' : [];
$to = is_array($config) ? (string) ($config['to'] ?? '') : '';
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    respond(false, 500, 'The form isn’t working right now. Please contact us on LinkedIn instead.');
}

// Filled in only by bots: pretend it worked and send nothing
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(true, 200, 'Sent.');
}

// One line, no control characters: nothing can be smuggled into a mail header
$line = static fn (string $key, int $max): string =>
    mb_substr(trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) ($_POST[$key] ?? ''))), 0, $max);

$name = $line('name', 100);
$email = $line('email', 200);
$company = $line('company', 120);
$message = mb_substr(trim(str_replace("\r\n", "\n", (string) ($_POST['message'] ?? ''))), 0, 5000);

$errors = [];
if ($name === '') {
    $errors['name'] = 'Please tell us your name.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter an email address we can reply to, like name@company.com.';
}
if ($message === '') {
    $errors['message'] = 'Please tell us a little about what you need help with.';
}
if ($errors) {
    respond(false, 422, 'Please fix the highlighted fields.', $errors);
}

// A few messages per visitor per hour is plenty for people, and slows down scripts
$ipKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __DIR__);
$log = sys_get_temp_dir() . '/expandia-contact-' . substr($ipKey, 0, 32);
$recent = array_filter(
    array_map('intval', is_file($log) ? (array) file($log, FILE_IGNORE_NEW_LINES) : []),
    static fn (int $t): bool => $t > time() - 3600
);
if (count($recent) >= 5) {
    respond(false, 429, 'You’ve sent several messages in the last hour. Please wait a while and try again.');
}

$subject = 'Website enquiry from ' . $name . ($company !== '' ? ' (' . $company . ')' : '');
$body = "Name: {$name}\nEmail: {$email}\nCompany: " . ($company !== '' ? $company : '-') . "\n\n{$message}\n\n"
    . "Sent from the contact form on expandialabs.com\n";
$headers = implode("\r\n", [
    'From: Expandia Labs website <' . $to . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $to);
if (!$sent) {
    respond(false, 502, 'Your message wasn’t sent because of a problem on our side. Please try again later, or contact us on LinkedIn.');
}

$recent[] = time();
@file_put_contents($log, implode("\n", $recent));

respond(true, 200, 'Sent.');
