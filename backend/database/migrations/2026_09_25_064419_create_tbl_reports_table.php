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
        Schema::create('tbl_reports', function (Blueprint $table) {
            $table->increments('report_id'); //PK
            $table->string('report_name', 100);
            $table->string('file_path', 255);
            $table->string('file_format', 10);
            $table->unsignedInteger('exported_by');
            $table->foreign('exported_by')->references('user_id')->on('tbl_users');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_reports');
    }
};
