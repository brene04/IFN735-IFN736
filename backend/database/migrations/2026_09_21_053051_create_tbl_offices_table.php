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
        Schema::create('tbl_offices', function (Blueprint $table) {
            $table->increments('office_id'); //PK
            $table->string('office_code', 50)->nullable();
            $table->string('office_name', 100);
            $table->text('description')->nullable();
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
        Schema::dropIfExists('tbl_offices');
    }
};
