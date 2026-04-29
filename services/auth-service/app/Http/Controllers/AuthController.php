<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RefreshToken;
use App\Models\Role;
use App\Models\TokenBlacklist;
use App\Models\User;
use App\Services\JwtService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;


class AuthController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'username' => ['nullable', 'string', 'max:80', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $customerRole = Role::firstOrCreate(
            ['name' => 'customer'],
            ['description' => 'Regular customer']
        );

        $user = User::create([
            'role_id' => $customerRole->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? null,
            'password' => $validated['password'],
            'is_active' => true,
        ]);

        $tokens = $this->issueTokens($user);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => $user->load('role'),
                ...$tokens,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'identifier' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('role')
            ->where('email', $validated['identifier'])
            ->orWhere('username', $validated['identifier'])
            ->first();

        if (!$user || !$user->password || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['Email/username or password is incorrect'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'User account is inactive',
            ], 403);
        }

        $tokens = $this->issueTokens($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                ...$tokens,
            ],
        ]);
    }

    public function refresh(Request $request)
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tokenHash = $this->jwtService->hashRefreshToken($validated['refresh_token']);

        $refreshToken = RefreshToken::with('user.role')
            ->where('token_hash', $tokenHash)
            ->first();

        if (!$refreshToken || $refreshToken->isRevoked() || $refreshToken->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid, revoked, or expired refresh token',
            ], 401);
        }

        if (!$refreshToken->user || !$refreshToken->user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'User is inactive or not found',
            ], 401);
        }

        $accessToken = $this->jwtService->generateAccessToken($refreshToken->user);

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'access_token' => $accessToken['token'],
                'token_type' => 'Bearer',
                'expires_in' => config('jwt.access_token_ttl_minutes') * 60,
                'access_token_expires_at' => $accessToken['expires_at']->toISOString(),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $payload = $request->attributes->get('jwt_payload');

        TokenBlacklist::firstOrCreate(
            ['jti' => $payload->jti],
            [
                'user_id' => $user->id,
                'expires_at' => Carbon::createFromTimestamp($payload->exp),
            ]
        );

        RefreshToken::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('role'),
            ],
        ]);
    }

    private function issueTokens(User $user): array
    {
        $user->load('role');

        $accessToken = $this->jwtService->generateAccessToken($user);
        $refreshTokenPlain = $this->jwtService->generateRefreshToken();

        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => $this->jwtService->hashRefreshToken($refreshTokenPlain),
            'expires_at' => now()->addDays((int) config('jwt.refresh_token_ttl_days')),
        ]);

        return [
            'access_token' => $accessToken['token'],
            'refresh_token' => $refreshTokenPlain,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.access_token_ttl_minutes') * 60,
            'access_token_expires_at' => $accessToken['expires_at']->toISOString(),
            'refresh_token_expires_at' => $refreshToken->expires_at->toISOString(),
        ];
    }

}
