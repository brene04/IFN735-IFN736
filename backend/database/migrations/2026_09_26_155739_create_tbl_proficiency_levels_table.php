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
        Schema::create('tbl_proficiency_levels', function (Blueprint $table) {
            $table->increments('proficiency_level_id'); //PK
            $table->unsignedInteger('competency_id');
            $table->foreign('competency_id')->references('competency_id')->on('tbl_competencies');
            $table->unsignedInteger('level_number');
            $table->text('description');
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
        Schema::dropIfExists('tbl_proficiency_levels');
    }
};
