<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

$subdomain = (string) (getenv('KOMMO_SUBDOMAIN') ?: '');
$token = (string) (getenv('KOMMO_LONG_LIVED_TOKEN') ?: '');

if ($subdomain === '' || $token === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'kommo_not_configured']);
    exit;
}

$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$cep = trim((string)($input['cep'] ?? ''));
$objective = trim((string)($input['objective'] ?? ''));
$creditValue = (string)($input['credit_value'] ?? '');
$months = (string)($input['months'] ?? '');
$installment = trim((string)($input['installment'] ?? ''));
$pageUrl = trim((string)($input['page_url'] ?? ''));
$source = trim((string)($input['source'] ?? ''));

if ($name === '' || $phone === '' || $objective === '' || $creditValue === '' || $months === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'missing_required_fields']);
    exit;
}

$pipelineIdEnv = getenv('KOMMO_PIPELINE_ID');
$statusIdEnv = getenv('KOMMO_STATUS_ID');
$pipelineId = is_string($pipelineIdEnv) && ctype_digit($pipelineIdEnv) ? (int)$pipelineIdEnv : null;
$statusId = is_string($statusIdEnv) && ctype_digit($statusIdEnv) ? (int)$statusIdEnv : null;

$leadName = 'Simulação - ' . $objective . ' - ' . $creditValue;

$contactCustomFields = [
    [
        'field_code' => 'PHONE',
        'values' => [
            [
                'value' => $phone,
                'enum_code' => 'WORK'
            ]
        ]
    ]
];

if ($email !== '') {
    $contactCustomFields[] = [
        'field_code' => 'EMAIL',
        'values' => [
            [
                'value' => $email,
                'enum_code' => 'WORK'
            ]
        ]
    ];
}

$lead = [
    'name' => $leadName,
    'metadata' => [
        'source' => $source !== '' ? $source : 'site_simulacao',
        'page_url' => $pageUrl
    ],
    '_embedded' => [
        'contacts' => [
            [
                'name' => $name,
                'custom_fields_values' => $contactCustomFields
            ]
        ]
    ]
];

if ($pipelineId !== null) {
    $lead['pipeline_id'] = $pipelineId;
}
if ($statusId !== null) {
    $lead['status_id'] = $statusId;
}

$complexPayload = [$lead];

[$statusCode, $responseBody] = kommoRequest(
    'POST',
    'https://' . $subdomain . '.kommo.com/api/v4/leads/complex',
    $token,
    json_encode($complexPayload, JSON_UNESCAPED_UNICODE)
);

if ($statusCode < 200 || $statusCode >= 300) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => 'kommo_api_error',
        'status' => $statusCode,
        'body' => $responseBody
    ]);
    exit;
}

$decoded = json_decode($responseBody, true);
if (!is_array($decoded) || !isset($decoded[0]['id'])) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'unexpected_kommo_response', 'body' => $responseBody]);
    exit;
}

$leadId = (int)$decoded[0]['id'];

$noteTextLines = [];
$noteTextLines[] = 'Nova simulação (site)';
$noteTextLines[] = 'Cliente: ' . $name;
$noteTextLines[] = 'WhatsApp: ' . $phone;
if ($email !== '') {
    $noteTextLines[] = 'Email: ' . $email;
}
if ($cep !== '') {
    $noteTextLines[] = 'CEP: ' . $cep;
}
$noteTextLines[] = 'Objetivo: ' . $objective;
$noteTextLines[] = 'Crédito desejado: ' . $creditValue;
$noteTextLines[] = 'Prazo: ' . $months . ' meses';
if ($installment !== '') {
    $noteTextLines[] = 'Parcela estimada: ' . $installment;
}
if ($pageUrl !== '') {
    $noteTextLines[] = 'Página: ' . $pageUrl;
}

$notePayload = [
    [
        'note_type' => 'common',
        'params' => [
            'text' => implode("\n", $noteTextLines)
        ]
    ]
];

kommoRequest(
    'POST',
    'https://' . $subdomain . '.kommo.com/api/v4/leads/' . $leadId . '/notes',
    $token,
    json_encode($notePayload, JSON_UNESCAPED_UNICODE)
);

echo json_encode(['ok' => true, 'lead_id' => $leadId]);
exit;

function kommoRequest(string $method, string $url, string $token, string $body = ''): array {
    $ch = curl_init($url);
    if ($ch === false) {
        return [0, 'curl_init_failed'];
    }

    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);

    if ($body !== '' && $method !== 'GET') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return [0, $error];
    }
    curl_close($ch);
    return [$statusCode, (string)$response];
}

