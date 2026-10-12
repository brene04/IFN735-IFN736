<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_users', function (Blueprint $table) {
            $table->increments('user_id'); //PK
            $table->unsignedInteger('role_id');
            $table->foreign('role_id')->references('role_id')->on('tbl_roles');
            $table->unsignedInteger('employee_id')->nullable();
            $table->foreign('employee_id')->references('employee_id')->on('tbl_employees');
            $table->string('username', 50);
            $table->string('email', 100)->nullable();
            $table->string('password_hash', 255);
            $table->string('status', 20)->nullable()->default('Active');
            $table->dateTime('last_login')->nullable();
            $table->dateTime('created_at')->nullable()->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_users');
    }
};
