<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;

class JwtService
{
    private string $secret;

    public function __construct()
    {
        $this->secret = config('jwt.secret');
    }

    public function generateAccessToken(User $user): array
    {
        $now = now();
        $expiresAt = $now->copy()->addMinutes((int) config('jwt.access_token_ttl_minutes'));
        $jti = (string) Str::uuid();

        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->id,
            'jti' => $jti,
            'name' => $user->name,
            'email' => $user->email,
            'role' => optional($user->role)->name,
            'iat' => $now->timestamp,
            'exp' => $expiresAt->timestamp,
        ];

        return [
            'token' => JWT::encode($payload, $this->secret, 'HS256'),
            'jti' => $jti,
            'expires_at' => $expiresAt,
        ];
    }

    public function decodeAccessToken(string $token): object
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }

    public function generateRefreshToken(): string
    {
        return Str::random(80);
    }

    public function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }
}