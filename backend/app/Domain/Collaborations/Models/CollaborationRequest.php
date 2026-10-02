<?php

namespace App\Domain\Collaborations\Models;

use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use Database\Factories\CollaborationRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'title',
    'description',
    'category_id',
    'required_discipline',
    'location',
    'is_remote',
    'budget',
    'deadline',
    'participants_needed',
    'status',
])]
class CollaborationRequest extends Model
{
    /** @use HasFactory<CollaborationRequestFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_remote' => 'boolean',
            'budget' => 'decimal:2',
            'deadline' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
