<?php

namespace DiaX\Config;

use DI\Container;

/**
 * Compatibility class for backwards compatibility
 * 
 * This class provides backward compatibility for code using AppContainer
 * from the root namespace.
 */
class AppContainer
{
    /**
     * Create and return a container instance
     * 
     * @return Container
     */
    public static function create(): Container
    {
        // Forward to the main container class
        return \DiaX\Config\AppContainer::create();
    }
} 