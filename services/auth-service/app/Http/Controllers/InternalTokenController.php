<?php

namespace App\Http\Controllers;

use App\Models\TokenBlacklist;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Throwable;

class InternalTokenController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function verify(Request $request)
    {
        $header = $request->header('Authorization');

        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'Authorization token is required',
            ], 401);
        }

        $token = substr($header, 7);

        try {
            $payload = $this->jwtService->decodeAccessToken($token);

            if (!isset($payload->jti) || !isset($payload->sub)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid token payload',
                ], 401);
            }

            $isBlacklisted = TokenBlacklist::where('jti', $payload->jti)->exists();

            if ($isBlacklisted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token has been revoked',
                ], 401);
            }

            $user = User::with('role')->find($payload->sub);

            if (!$user || !$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is inactive or not found',
                ], 401);
            }

            return response()->json([
                'success' => true,
                'message' => 'Token is valid',
                'data' => [
                    'user' => $user,
                    'payload' => [
                        'sub' => $payload->sub,
                        'jti' => $payload->jti,
                        'email' => $payload->email ?? null,
                        'role' => $payload->role ?? null,
                        'exp' => $payload->exp ?? null,
                    ],
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token',
            ], 401);
        }
    }
}