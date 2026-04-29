<?php

return [
    'secret' => env('JWT_SECRET', 'change_this_jwt_secret_key_minimum_32_chars'),
    'access_token_ttl_minutes' => env('JWT_ACCESS_TOKEN_TTL', 15),
    'refresh_token_ttl_days' => env('JWT_REFRESH_TOKEN_TTL', 7),
];