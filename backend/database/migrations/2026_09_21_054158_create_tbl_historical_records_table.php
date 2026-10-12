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
            $table->increments('record_id'); //PK
            $table->unsignedInteger('employee_id');
            $table->foreign('employee_id')->references('employee_id')->on('tbl_employees');
            $table->string('record_type', 50);
            $table->text('description')->nullable();
            $table->date('effective_date')->nullable();
            $table->dateTime('created_at')->nullable()->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
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
