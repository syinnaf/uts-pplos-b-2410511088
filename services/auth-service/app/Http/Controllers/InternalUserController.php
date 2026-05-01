<?php

namespace App\Http\Controllers;

use App\Models\User;

class InternalUserController extends Controller
{
    public function show(int $id)
    {
        $user = User::with('role')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'User is inactive',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => [
                'user' => $user,
            ],
        ]);
    }
}