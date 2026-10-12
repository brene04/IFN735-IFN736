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
        Schema::create('tbl_position_competencies', function (Blueprint $table) {
            $table->increments('position_competency_id'); //PK
            $table->unsignedInteger('position_id');
            $table->foreign('position_id')->references('position_id')->on('tbl_positions');
            $table->unsignedInteger('competency_id');
            $table->foreign('competency_id')->references('competency_id')->on('tbl_competencies');
            $table->unsignedInteger('required_level');
            $table->unsignedInteger('priority')->nullable();
            $table->dateTime('created_at')->nullable()->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_position_competencies');
    }
};
