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
        Schema::create('tbl_historical_records', function (Blueprint $table) {
            $table->unsignedInteger('record_id')->primary(); 
            $table->unsignedInteger('employee_id');
            $table->foreign('employee_id')->references('employee_id')->on('tbl_employees');
            $table->string('record_type', 50);
            $table->text('description');
            $table->dateTime('effective_date');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_historical_records');
    }
};
