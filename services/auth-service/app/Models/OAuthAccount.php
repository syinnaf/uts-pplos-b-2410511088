<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OAuthAccount extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
        'provider_email',
        'provider_avatar',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
