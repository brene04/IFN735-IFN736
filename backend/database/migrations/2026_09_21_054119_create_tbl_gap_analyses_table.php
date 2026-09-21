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
        Schema::create('tbl_gap_analyses', function (Blueprint $table) {
            $table->unsignedInteger('gap_analysis_id')->primary();            
            $table->unsignedInteger('employee_id');
            $table->foreign('employee_id')->references('employee_id')->on('tbl_employees');
            $table->unsignedInteger('position_id');
            $table->foreign('position_id')->references('position_id')->on('tbl_positions');
            $table->date('analysis_date');
            $table->string('status', 20);
            $table->text('remarks');
            $table->unsignedInteger('created_by');
            $table->foreign('created_by')->references('user_id')->on('tbl_users');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_gap_analyses');
    }
};
