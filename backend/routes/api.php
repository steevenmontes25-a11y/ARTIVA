<?php

use App\Domain\Auth\Http\Controllers\ArtistProfileController;
use App\Domain\Auth\Http\Controllers\AuthController;
use App\Domain\Auth\Http\Controllers\OnboardingController;
use App\Domain\Auth\Http\Controllers\ProfileController;
use App\Domain\Feed\Http\Controllers\CategoryController;
use App\Domain\Feed\Http\Controllers\FeedController;
use App\Domain\Posts\Http\Controllers\CommentController;
use App\Domain\Posts\Http\Controllers\PostController;
use App\Domain\Posts\Http\Controllers\UserPostsController;
use App\Domain\Social\Http\Controllers\FollowController;
use App\Domain\Social\Http\Controllers\PostInteractionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('register');
    Route::post('login', [AuthController::class, 'login'])->name('login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
    });
});

// Lectura pública: accesibles sin sesión (modo invitado), pero si la petición
// trae un Bearer token válido se autentica igual que en las rutas protegidas
// (request->user() queda resuelto), para poder calcular is_following /
// viewer_has_liked / viewer_has_saved. Sin token, esos campos quedan en false
// — ver AuthenticateOptionally.
Route::middleware('auth.optional')->group(function () {
    Route::get('feed', [FeedController::class, 'index'])->name('feed.index');
    Route::get('posts/{post}/comments', [CommentController::class, 'index'])->name('posts.comments.index');
    Route::get('artists/{user:username}', [ArtistProfileController::class, 'show'])->name('artists.show');
    Route::get('artists/{user:username}/posts', [UserPostsController::class, 'index'])->name('artists.posts');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::put('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');

    Route::post('posts', [PostController::class, 'store'])->name('posts.store');
    Route::delete('posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');

    Route::post('posts/{post}/like', [PostInteractionController::class, 'like'])->name('posts.like');
    Route::delete('posts/{post}/like', [PostInteractionController::class, 'unlike'])->name('posts.unlike');
    Route::post('posts/{post}/save', [PostInteractionController::class, 'save'])->name('posts.save');
    Route::delete('posts/{post}/save', [PostInteractionController::class, 'unsave'])->name('posts.unsave');

    Route::post('posts/{post}/comments', [CommentController::class, 'store'])->name('posts.comments.store');

    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::post('artists/{user:username}/follow', [FollowController::class, 'toggle'])->name('artists.follow');
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
