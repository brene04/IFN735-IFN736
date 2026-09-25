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
        Schema::create('tbl_competencies', function (Blueprint $table) {
            $table->increments('competency_id'); //PK
            $table->string('competency_code', 50);
            $table->string('competency_name', 100);
            $table->text('description');
            $table->string('competency_type', 50);
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
        Schema::dropIfExists('tbl_competencies');
    }
};
