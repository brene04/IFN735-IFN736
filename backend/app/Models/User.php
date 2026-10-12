<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;

// ================<default setting>================
// use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Illuminate\Notifications\Notifiable;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
// use Database\Factories\UserFactory;

// #[Fillable(['name', 'email', 'password'])]
// #[Hidden(['password', 'remember_token'])]
// class User extends Authenticatable
// {
//     /** @use HasFactory<UserFactory> */
//     use HasFactory, Notifiable;

//     /**
//      * Get the attributes that should be cast.
//      *
//      * @return array<string, string>
//      */
//     protected function casts(): array
//     {
//         return [
//             'email_verified_at' => 'datetime',
//             'password' => 'hashed',
//         ];
//     }
// }
// ================<default setting>================

#[Fillable([
    'role_id',        
    'employee_id',
    'username',
    'email',
    'password_hash',
    'status'
])]

#[Hidden(['password_hash'])]

class User extends Authenticatable
{
    protected $table = 'tbl_users';
    protected $primaryKey = 'user_id';
    public $timestamps = false;
    
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function getAuthPasswordName() : string
    {
        return 'password_hash';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
        ];
    }
}