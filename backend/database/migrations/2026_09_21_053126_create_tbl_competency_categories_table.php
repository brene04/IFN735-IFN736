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
        Schema::create('tbl_competency_categories', function (Blueprint $table) {
            $table->increments('competency_category_id'); //PK
            $table->string('competency_category_code', 50);
            $table->string('competency_category_name', 100);
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
        Schema::dropIfExists('tbl_competency_categories');
    }
};
