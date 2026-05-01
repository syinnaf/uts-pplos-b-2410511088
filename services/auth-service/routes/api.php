<?php

use App\Http\Controllers\AuthController;
use App\Http\Middleware\JwtAuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OAuthController;
use App\Http\Controllers\InternalUserController;
use App\Http\Middleware\InternalServiceMiddleware;
use App\Http\Controllers\InternalTokenController;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'service' => 'auth-service',
        'message' => 'Auth Service is running',
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    Route::get('/google/redirect', [OAuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [OAuthController::class, 'handleGoogleCallback']);

    Route::middleware(JwtAuthMiddleware::class)->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('internal')
    ->middleware(InternalServiceMiddleware::class)
    ->group(function () {
        Route::get('/users/{id}', [InternalUserController::class, 'show']);
        Route::post('/tokens/verify', [InternalTokenController::class, 'verify']);
    });