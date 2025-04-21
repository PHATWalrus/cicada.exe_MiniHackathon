<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateResourcesTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('resources')) {
            Capsule::schema()->create('resources', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description');
                $table->string('url')->nullable();
                $table->string('category');
                $table->string('type')->default('article');
                $table->json('tags')->nullable();
                $table->boolean('is_approved')->default(true);
                $table->timestamps();
            });
            
            echo "Table 'resources' created successfully.\n";
        } else {
            echo "Table 'resources' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('resources');
    }
} 