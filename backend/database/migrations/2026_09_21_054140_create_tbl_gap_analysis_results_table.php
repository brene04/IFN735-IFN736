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
        Schema::create('tbl_gap_analysis_results', function (Blueprint $table) {
            $table->increments('gap_analysis_result_id'); //PK
            $table->unsignedInteger('gap_analysis_id');
            $table->foreign('gap_analysis_id')->references('gap_analysis_id')->on('tbl_gap_analyses');
            $table->unsignedInteger('competency_id');
            $table->foreign('competency_id')->references('competency_id')->on('tbl_competencies');
            $table->unsignedInteger('required_level');
            $table->unsignedInteger('current_level');
            $table->integer('gap_level');
            $table->string('status', 20);
            $table->text('remarks');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_gap_analysis_results');
    }
};
