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
        Schema::create('tbl_employees', function (Blueprint $table) {
            $table->increments('employee_id'); //PK
            $table->unsignedInteger('office_id');
            $table->foreign('office_id')->references('office_id')->on('tbl_offices');
            $table->unsignedInteger('position_id');
            $table->foreign('position_id')->references('position_id')->on('tbl_positions');
            $table->string('employee_no', 50);
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);
            $table->string('email', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->date('date_hired')->nullable();
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
        Schema::dropIfExists('tbl_employees');
    }
};
