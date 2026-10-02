<?php

namespace App\Domain\Feed\Http\Controllers;

use App\Domain\Feed\Http\Resources\CategoryResource;
use App\Domain\Feed\Models\Category;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::orderBy('name')->get());
    }
}
