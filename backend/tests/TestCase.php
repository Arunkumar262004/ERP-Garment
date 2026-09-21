<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Force the sqlite test connection regardless of the container's real
     * DB_CONNECTION/DB_DATABASE env vars. PHP's CLI SAPI copies the OS
     * environment into $_SERVER before PHPUnit boots, and phpunit.xml's
     * <env force="true"> only overrides getenv()/$_ENV — Laravel's env()
     * still reads the stale $_SERVER value first. Without this, RefreshDatabase
     * migrates and wipes whatever database DB_CONNECTION actually points at,
     * which in this project's docker-compose setup is the real dev MySQL
     * database, not an isolated test database.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }
}
