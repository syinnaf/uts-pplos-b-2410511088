<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalServiceMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Internal-Token');

        if (!$token || $token !== env('INTERNAL_SERVICE_TOKEN')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid internal service token',
            ], 403);
        }

        return $next($request);
    }
}