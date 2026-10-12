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
            $table->unsignedInteger('category_id')->nullable(); 
            $table->foreign('category_id')->references('category_id')->on('tbl_competency_categories');
            $table->string('competency_code', 50)->nullable();
            $table->string('competency_name', 255);
            $table->text('description')->nullable();
            $table->string('competency_type', 50)->nullable();
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
        Schema::dropIfExists('tbl_competencies');
    }
};
