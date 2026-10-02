<?php

namespace Tests\Feature\Auth;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_empty_artist_profile_and_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ada Lovelace',
            'username' => 'ada_lovelace',
            'email' => 'ada@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()->assertJsonStructure([
            'data' => ['id', 'name', 'username', 'email', 'onboarding_completed', 'artist_profile'],
            'token',
        ]);

        $this->assertDatabaseHas('users', [
            'username' => 'ada_lovelace',
            'email' => 'ada@example.com',
        ]);

        $user = User::where('email', 'ada@example.com')->firstOrFail();

        $this->assertDatabaseHas('artist_profiles', [
            'user_id' => $user->id,
            'primary_discipline' => null,
        ]);

        $this->assertFalse($response->json('data.onboarding_completed'));
    }

    public function test_register_fails_with_duplicate_username_or_email(): void
    {
        User::factory()->create(['username' => 'taken', 'email' => 'taken@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Someone Else',
            'username' => 'taken',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['username', 'email']);
    }

    public function test_register_fails_when_password_too_short_or_unconfirmed(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Someone',
            'username' => 'someone',
            'email' => 'someone@example.com',
            'password' => 'short',
            'password_confirmation' => 'nomatch',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_login_with_email_returns_token(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'username' => 'loginuser',
            'password' => Hash::make('supersecret'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'login@example.com',
            'password' => 'supersecret',
        ]);

        $response->assertOk()->assertJsonStructure(['data' => ['id', 'email'], 'token']);
    }

    public function test_login_with_username_returns_token(): void
    {
        User::factory()->create([
            'email' => 'login2@example.com',
            'username' => 'loginuser2',
            'password' => Hash::make('supersecret'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'loginuser2',
            'password' => 'supersecret',
        ]);

        $response->assertOk()->assertJsonStructure(['data' => ['id', 'username'], 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'wrong@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'wrong@example.com',
            'password' => 'incorrect-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['login']);
    }

    public function test_login_fails_when_user_does_not_exist(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'nobody@example.com',
            'password' => 'whatever123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['login']);
    }

    public function test_me_returns_authenticated_user_with_profile(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create([
            'primary_discipline' => 'Fotografía',
            'onboarding_completed' => true,
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.onboarding_completed', true)
            ->assertJsonPath('data.artist_profile.primary_discipline', 'Fotografía');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // El guard de Sanctum cachea el usuario resuelto en el contenedor de
        // la app durante la vida del proceso de test; sin esto, la segunda
        // petición reutilizaría la resolución de auth de la primera llamada
        // en vez de re-validar el token (ya borrado) contra la base de datos.
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }
}
