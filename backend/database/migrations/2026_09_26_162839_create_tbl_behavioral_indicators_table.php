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
        Schema::create('tbl_behavioral_indicators', function (Blueprint $table) {
            $table->increments('behavioral_indicators_id'); //PK
            $table->unsignedInteger('proficiency_level_id');
            $table->foreign('proficiency_level_id')->references('proficiency_level_id')->on('tbl_proficiency_levels');
            $table->string('indicator_code', 10);
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
        Schema::dropIfExists('tbl_behavioral_indicators');
    }
};
