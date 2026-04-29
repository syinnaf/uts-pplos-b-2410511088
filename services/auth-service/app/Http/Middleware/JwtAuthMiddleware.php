<?php

namespace App\Http\Middleware;

use App\Models\TokenBlacklist;
use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class JwtAuthMiddleware
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function handle(Request $request, Closure $next): Response
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

            $request->attributes->set('auth_user', $user);
            $request->attributes->set('jwt_payload', $payload);

            return $next($request);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token',
            ], 401);
        }
    }
}