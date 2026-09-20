<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        return User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'role']);
    }
}
