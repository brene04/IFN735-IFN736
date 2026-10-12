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
            $table->increments('position_id'); //PK
            $table->string('position_code', 50)->nullable();
            $table->string('position_title', 100);
            $table->text('description')->nullable();
            $table->string('department', 100)->nullable();
            $table->string('employment_type', 50)->nullable();
            $table->string('salary_grade', 20)->nullable();
            $table->string('status', 20)->nullable()->default('Active');
            $table->dateTime('created_at')->nullable()->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
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
