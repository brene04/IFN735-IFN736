<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'category_code',
    'category_name',
    'description',
    'status'
])]
class CompetencyCategory extends Model
{
    protected $table = 'tbl_competency_categories';
    protected $primaryKey = 'category_id';
    public $timestamps = false;
    
    public function competencies(): HasMany
    {
        return $this->hasMany(Competency::class, 'category_id', 'category_id');
    }

}
