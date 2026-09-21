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
        Schema::create('tbl_employee_competencies', function (Blueprint $table) {
            $table->unsignedInteger('employee_competency_id')->primary();
            $table->unsignedInteger('employee_id');
            $table->foreign('employee_id')->references('employee_id')->on('tbl_employees');
            $table->unsignedInteger('competency_id');
            $table->foreign('competency_id')->references('competency_id')->on('tbl_competencies');
            $table->unsignedInteger('current_level');
            $table->text('evidence');
            // $table->date('last_updated');
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
        Schema::dropIfExists('tbl_employee_competencies');
    }
};
