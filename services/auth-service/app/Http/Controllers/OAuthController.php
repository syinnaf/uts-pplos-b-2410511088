<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\OAuthAccount;
use App\Models\RefreshToken;
use App\Models\Role;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class OAuthController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            $customerRole = Role::firstOrCreate(
                ['name' => 'customer'],
                ['description' => 'Regular customer']
            );

            $oauthAccount = OAuthAccount::where('provider', 'google')
                ->where('provider_user_id', $googleUser->getId())
                ->first();

            if ($oauthAccount) {
                $user = $oauthAccount->user;
            } else {
                $user = User::where('email', $googleUser->getEmail())->first();

                if (!$user) {
                    $user = User::create([
                        'role_id' => $customerRole->id,
                        'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Google User',
                        'email' => $googleUser->getEmail(),
                        'username' => $this->generateUsername($googleUser->getEmail()),
                        'password' => null,
                        'avatar_url' => $googleUser->getAvatar(),
                        'oauth_provider' => 'google',
                        'is_active' => true,
                        'email_verified_at' => now(),
                    ]);
                } else {
                    $user->update([
                        'avatar_url' => $googleUser->getAvatar() ?: $user->avatar_url,
                        'oauth_provider' => $user->oauth_provider ?: 'google',
                    ]);
                }

                OAuthAccount::create([
                    'user_id' => $user->id,
                    'provider' => 'google',
                    'provider_user_id' => $googleUser->getId(),
                    'provider_email' => $googleUser->getEmail(),
                    'provider_avatar' => $googleUser->getAvatar(),
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
                'message' => 'Google OAuth login successful',
                'data' => [
                    'user' => $user->load('role', 'oauthAccounts'),
                    ...$tokens,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google OAuth authentication failed',
                'error' => $e->getMessage(),
            ], 400);
        }
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

    private function generateUsername(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '_') ?: 'google_user';
        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . '_' . $counter;
            $counter++;
        }

        return $username;
    }
}
