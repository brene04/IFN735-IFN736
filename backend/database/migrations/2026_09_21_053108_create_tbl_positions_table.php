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
        Schema::create('tbl_positions', function (Blueprint $table) {
            $table->unsignedInteger('position_id')->primary();
            $table->string('position_code', 50);
            $table->string('position_title', 100);
            $table->text('description');
            $table->string('department', 100);
            $table->string('employment_type', 50);
            $table->string('status', 20);
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_positions');
    }
};
