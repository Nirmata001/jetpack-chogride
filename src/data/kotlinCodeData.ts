/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhysicsConfig } from '../types/game';

export interface KotlinFile {
  name: string;
  path: string;
  category: 'Physics' | 'Collision' | 'Entities' | 'Game Loop' | 'Compose';
  description: string;
  code: string;
}

export function getKotlinFiles(config: PhysicsConfig): KotlinFile[] {
  return [
    {
      name: 'PhysicsConstants.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/PhysicsConstants.kt',
      category: 'Physics',
      description: 'Central physics and movement configuration constants tuned to 60 FPS standard.',
      code: `package com.jetpack.joyride.engine

/**
 * Jetpack Joyride Core Physics Constants
 * Scaled for Android virtual coordinate space (e.g. 1920x1080 or 960x540 viewport).
 */
object PhysicsConstants {
    // Gravitational acceleration pulling the player downward (px/s^2)
    const val GRAVITY: Float = ${config.gravity.toFixed(1)}f

    // Upward acceleration produced by firing the jetpack (px/s^2)
    const val JETPACK_THRUST: Float = ${config.jetpackThrust.toFixed(1)}f

    // Maximum descent velocity to prevent uncontrollable falling (px/s)
    const val TERMINAL_VELOCITY_FALL: Float = ${config.terminalVelocityFall.toFixed(1)}f

    // Maximum ascent velocity to prevent rocket-clipping ceilings (px/s)
    const val TERMINAL_VELOCITY_CLIMB: Float = ${config.terminalVelocityClimb.toFixed(1)}f

    // Initial horizontal side-scrolling world velocity (px/s)
    const val BASE_SCROLL_SPEED: Float = ${config.baseScrollSpeed.toFixed(1)}f

    // Progressive scroll speed acceleration rate per distance unit
    const val SCROLL_ACCELERATION_FACTOR: Float = ${config.scrollAcceleration.toFixed(2)}f

    // Hitbox inset percentage (0.16 = 16% inner margin) for player fair-play forgiveness
    const val FAIR_PLAY_HITBOX_MARGIN: Float = ${config.hitboxMarginPercent.toFixed(2)}f

    // Fixed physics step time (60 Hz tick = ~0.016667 seconds)
    const val FIXED_DELTA_TIME: Float = 1.0f / 60.0f
}
`,
    },
    {
      name: 'Player.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/Player.kt',
      category: 'Physics',
      description: 'Player entity managing vertical velocity integration, ceiling/floor clamping, and state transitions.',
      code: `package com.jetpack.joyride.engine

import android.graphics.Canvas
import android.graphics.Paint

enum class PlayerState {
    RUNNING,   // On ground, feet running
    FLYING,    // Airborne, jetpack active or falling
    DYING,     // Electrocuted / hit by missile, tumbling
    DEAD       // Ragdoll stopped
}

class Player(
    var x: Float,
    var y: Float,
    val width: Float = 44f,
    val height: Float = 52f,
    val massMultiplier: Float = 1.0f,
    val thrustMultiplier: Float = 1.0f
) {
    // Current vertical velocity (positive = downward, negative = upward)
    var velocityY: Float = 0f
        private set

    // Net acceleration applied this frame (for telemetry and visual cues)
    var netAcceleration: Float = 0f
        private set

    var state: PlayerState = PlayerState.RUNNING
        private set

    var isJetpackActive: Boolean = false

    /**
     * Executes single Euler integration step for vertical movement.
     * @param dt Delta time in seconds (e.g. 0.0166f for 60fps).
     * @param ceilingY Top barrier Y coordinate.
     * @param floorY Bottom catwalk barrier Y coordinate.
     */
    fun updatePhysics(dt: Float, ceilingY: Float, floorY: Float) {
        if (state == PlayerState.DEAD) return

        // 1. Calculate net vertical acceleration
        val gravityForce = PhysicsConstants.GRAVITY * massMultiplier
        val thrustForce = if (isJetpackActive && state != PlayerState.DYING) {
            PhysicsConstants.JETPACK_THRUST * thrustMultiplier
        } else {
            0f
        }

        // Net vertical acceleration: positive pulls down, negative pushes up
        netAcceleration = gravityForce - thrustForce

        // 2. Semi-implicit Euler integration: v(t + dt) = v(t) + a * dt
        velocityY += netAcceleration * dt

        // 3. Terminal Velocity Clamping
        val maxFall = PhysicsConstants.TERMINAL_VELOCITY_FALL
        val maxClimb = -PhysicsConstants.TERMINAL_VELOCITY_CLIMB
        velocityY = velocityY.coerceIn(maxClimb, maxFall)

        // 4. Position update: y(t + dt) = y(t) + v * dt
        y += velocityY * dt

        // 5. Ceiling Collision & Momentum Cancellation
        if (y <= ceilingY) {
            y = ceilingY
            if (velocityY < 0f) {
                velocityY = 0f // Cancel upward momentum upon ceiling strike
            }
        }

        // 6. Floor Boundary & State Machine Transition
        val groundLimit = floorY - height
        if (y >= groundLimit) {
            y = groundLimit
            velocityY = 0f
            if (state != PlayerState.DYING) {
                state = PlayerState.RUNNING
            }
        } else {
            if (state != PlayerState.DYING) {
                state = PlayerState.FLYING
            }
        }
    }

    /**
     * Returns the fair-play Axis-Aligned Bounding Box (AABB) inset with forgiveness margin.
     */
    fun getHitbox(): BoundingBox {
        val padX = width * PhysicsConstants.FAIR_PLAY_HITBOX_MARGIN
        val padY = height * PhysicsConstants.FAIR_PLAY_HITBOX_MARGIN
        return BoundingBox(
            left = x + padX,
            top = y + padY,
            right = x + width - padX,
            bottom = y + height - padY
        )
    }

    fun triggerDeath() {
        state = PlayerState.DYING
        isJetpackActive = false
        // Add small tumble recoil
        velocityY = -240f
    }
}
`,
    },
    {
      name: 'BoundingBox.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/BoundingBox.kt',
      category: 'Collision',
      description: 'Zero-allocation 2D Axis-Aligned Bounding Box (AABB) data model and overlap logic.',
      code: `package com.jetpack.joyride.engine

/**
 * Axis-Aligned Bounding Box (AABB)
 * Represents an unrotated rectangle in 2D space.
 */
data class BoundingBox(
    var left: Float,
    var top: Float,
    var right: Float,
    var bottom: Float
) {
    val width: Float get() = right - left
    val height: Float get() = bottom - top
    val centerX: Float get() = (left + right) * 0.5f
    val centerY: Float get() = (top + bottom) * 0.5f

    /**
     * Core AABB Collision Detection Equation:
     * Two boxes overlap if and only if they overlap on both the X and Y axes simultaneously.
     * Separating Axis Theorem (SAT) simplified for axis-aligned rectangles.
     */
    fun intersects(other: BoundingBox): Boolean {
        return this.left < other.right &&
               this.right > other.left &&
               this.top < other.bottom &&
               this.bottom > other.top
    }

    /**
     * Circular proximity check for coins or blast radius.
     */
    fun intersectsCircle(circleX: Float, circleY: Float, radius: Float): Boolean {
        val closestX = circleX.coerceIn(left, right)
        val closestY = circleY.coerceIn(top, bottom)
        val dx = circleX - closestX
        val dy = circleY - closestY
        return (dx * dx + dy * dy) < (radius * radius)
    }

    /**
     * Sets box bounds without instantiating new objects (Android GC friendly).
     */
    fun set(l: Float, t: Float, r: Float, b: Float) {
        this.left = l
        this.top = t
        this.right = r
        this.bottom = b
    }
}
`,
    },
    {
      name: 'CollisionDetector.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/CollisionDetector.kt',
      category: 'Collision',
      description: 'System for evaluating player hits against obstacles, missiles, and collecting coins.',
      code: `package com.jetpack.joyride.engine

object CollisionDetector {

    /**
     * Checks if the player collided with any active obstacle in the game world.
     * Returns the obstacle that caused the hit, or null if player is safe.
     */
    fun checkObstacleCollisions(
        player: Player,
        obstacles: List<Obstacle>
    ): Obstacle? {
        val playerHitbox = player.getHitbox()

        for (obstacle in obstacles) {
            if (!obstacle.isActive) continue

            // 1. Broad-phase check: quick X-axis rejection
            if (obstacle.hitbox.right < playerHitbox.left || obstacle.hitbox.left > playerHitbox.right) {
                continue
            }

            // 2. Narrow-phase AABB collision check
            if (playerHitbox.intersects(obstacle.hitbox)) {
                return obstacle
            }
        }
        return null
    }

    /**
     * Checks coin collection and marks them as collected.
     * Returns total coins collected in this tick.
     */
    fun checkCoinCollections(
        player: Player,
        coins: MutableList<Coin>
    ): Int {
        val playerHitbox = player.getHitbox()
        var collectedCount = 0

        val iterator = coins.iterator()
        while (iterator.hasNext()) {
            val coin = iterator.next()
            if (!coin.collected && playerHitbox.intersectsCircle(coin.x, coin.y, coin.radius)) {
                coin.collected = true
                collectedCount += coin.value
                iterator.remove() // Recycle or remove collected coin
            }
        }
        return collectedCount
    }
}
`,
    },
    {
      name: 'ObstacleManager.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/ObstacleManager.kt',
      category: 'Entities',
      description: 'Endless side-scrolling obstacle manager with procedural spawning and object recycling.',
      code: `package com.jetpack.joyride.engine

import kotlin.random.Random

abstract class Obstacle(
    var x: Float,
    var y: Float,
    var width: Float,
    var height: Float
) {
    var isActive: Boolean = true
    val hitbox = BoundingBox(x, y, x + width, y + height)

    abstract fun update(dt: Float, scrollSpeed: Float)
}

class Zapper(
    x: Float,
    y: Float,
    val length: Float = 120f,
    val isVertical: Boolean = false
) : Obstacle(x, y, if (isVertical) 28f else length, if (isVertical) length else 28f) {

    override fun update(dt: Float, scrollSpeed: Float) {
        // Zapper moves left with world scrolling
        x -= scrollSpeed * dt

        // Update bounding box coordinates
        val halfW = width * 0.5f
        val halfH = height * 0.5f
        hitbox.set(x - halfW, y - halfH, x + halfW, y + halfH)
    }
}

class HomingMissile(
    x: Float,
    var targetY: Float
) : Obstacle(x, targetY, 44f, 22f) {

    enum class MissileState { WARNING, LAUNCHED }
    var state = MissileState.WARNING
    var warningTimer = 1.5f
    val flightSpeed = 480f

    override fun update(dt: Float, scrollSpeed: Float) {
        if (state == MissileState.WARNING) {
            warningTimer -= dt
            // Softly track player's altitude
            y += (targetY - y) * 2.5f * dt
            if (warningTimer <= 0f) {
                state = MissileState.LAUNCHED
            }
        } else {
            // Rocket travels left at world scroll speed + independent rocket thrust
            x -= (scrollSpeed + flightSpeed) * dt
            hitbox.set(x - 20f, y - 10f, x + 20f, y + 10f)
        }
    }
}

class Coin(
    var x: Float,
    var y: Float,
    val radius: Float = 10f,
    val value: Int = 1,
    var collected: Boolean = false
)
`,
    },
    {
      name: 'GameLoopThread.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/GameLoopThread.kt',
      category: 'Game Loop',
      description: 'Dedicated high-performance game loop thread targeting smooth 60 FPS with fixed delta-time accumulation.',
      code: `package com.jetpack.joyride.engine

import android.graphics.Canvas
import android.view.SurfaceHolder

/**
 * High-performance Game Thread decoupling physics ticks from Android UI thread.
 * Uses fixed delta-time physics accumulation to prevent tunneling and frame stutter.
 */
class GameLoopThread(
    private val surfaceHolder: SurfaceHolder,
    private val gameView: GameView
) : Thread() {

    @Volatile
    var isRunning: Boolean = false

    // Target 60 FPS (16.66 ms per frame)
    private val targetFps = 60
    private val targetFrameTimeMs = 1000L / targetFps

    override fun run() {
        var lastTime = System.nanoTime()
        var accumulator = 0.0

        val fixedDt = PhysicsConstants.FIXED_DELTA_TIME.toDouble()

        while (isRunning) {
            val now = System.nanoTime()
            val frameTime = (now - lastTime) / 1_000_000_000.0
            lastTime = now

            // Avoid spiral of death on long pause
            val clampedFrameTime = frameTime.coerceAtMost(0.25)
            accumulator += clampedFrameTime

            // Fixed timestep physics update: ensures deterministic collision detection
            while (accumulator >= fixedDt) {
                gameView.updatePhysics(PhysicsConstants.FIXED_DELTA_TIME)
                accumulator -= fixedDt
            }

            // Render interpolated frame onto locked SurfaceView canvas
            var canvas: Canvas? = null
            try {
                canvas = surfaceHolder.lockCanvas()
                if (canvas != null) {
                    synchronized(surfaceHolder) {
                        gameView.drawGame(canvas)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                if (canvas != null) {
                    try {
                        surfaceHolder.unlockCanvasAndPost(canvas)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }

            // Frame rate capping
            val elapsedMs = (System.nanoTime() - now) / 1_000_000L
            val sleepTimeMs = targetFrameTimeMs - elapsedMs
            if (sleepTimeMs > 0) {
                try {
                    sleep(sleepTimeMs)
                } catch (ignored: InterruptedException) {}
            }
        }
    }
}
`,
    },
    {
      name: 'GameView.kt',
      path: 'app/src/main/java/com/jetpack/joyride/engine/GameView.kt',
      category: 'Game Loop',
      description: 'Android SurfaceView managing touch input events, endless scrolling updates, and Canvas rendering.',
      code: `package com.jetpack.joyride.engine

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView

class GameView(context: Context) : SurfaceView(context), SurfaceHolder.Callback {

    private var gameThread: GameLoopThread? = null

    // Player Entity
    val player = Player(x = 180f, y = 300f)

    // World & Movement
    var worldScrollSpeed = PhysicsConstants.BASE_SCROLL_SPEED
    var distanceTraveledMeters = 0f

    // Obstacles & Coins
    val obstacles = mutableListOf<Obstacle>()
    val coins = mutableListOf<Coin>()

    // Boundaries
    val ceilingY = 50f
    val floorY = 700f

    init {
        holder.addCallback(this)
        isFocusable = true
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        gameThread = GameLoopThread(holder, this).apply {
            isRunning = true
            start()
        }
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        var retry = true
        gameThread?.isRunning = false
        while (retry) {
            try {
                gameThread?.join()
                retry = false
            } catch (e: InterruptedException) {
                // Retry until thread cleanly terminates
            }
        }
        gameThread = null
    }

    /**
     * Handle single touch / hold input:
     * - ACTION_DOWN: Jetpack ignites, upward acceleration applied.
     * - ACTION_UP: Jetpack cuts out, gravity takes over.
     */
    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                player.isJetpackActive = true
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                player.isJetpackActive = false
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    /**
     * Executes single physics tick. Called from GameLoopThread with fixed delta time.
     */
    fun updatePhysics(dt: Float) {
        // 1. Update player vertical velocity and boundaries
        player.updatePhysics(dt, ceilingY, floorY)

        if (player.state == PlayerState.DYING || player.state == PlayerState.DEAD) {
            return
        }

        // 2. Advance endless scroll distance & dynamic speed
        worldScrollSpeed += PhysicsConstants.SCROLL_ACCELERATION_FACTOR * dt
        distanceTraveledMeters += (worldScrollSpeed * dt) / 50f

        // 3. Update obstacles & missiles
        val iterator = obstacles.iterator()
        while (iterator.hasNext()) {
            val obs = iterator.next()
            obs.update(dt, worldScrollSpeed)
            if (obs.x < -150f) {
                iterator.remove() // Despawn offscreen obstacle
            }
        }

        // 4. Collision Detection using AABB logic
        val hitObstacle = CollisionDetector.checkObstacleCollisions(player, obstacles)
        if (hitObstacle != null) {
            player.triggerDeath()
        }

        // 5. Coin collection
        CollisionDetector.checkCoinCollections(player, coins)
    }

    /**
     * Renders game frame onto locked Canvas.
     */
    fun drawGame(canvas: Canvas) {
        // Clear background
        canvas.drawColor(Color.rgb(15, 23, 42))

        // Draw parallax tracks, player sprite, obstacles, coins & HUD meters
    }
}
`,
    },
    {
      name: 'ComposeGameLoop.kt',
      path: 'app/src/main/java/com/jetpack/joyride/ui/ComposeGameLoop.kt',
      category: 'Compose',
      description: 'Modern Jetpack Compose Canvas implementation using withFrameNanos game loop.',
      code: `package com.jetpack.joyride.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import com.jetpack.joyride.engine.PhysicsConstants
import com.jetpack.joyride.engine.Player

/**
 * Modern Jetpack Compose declarative game loop implementation.
 * Leverages withFrameNanos for vsync-locked frame updates without raw Threads.
 */
@Composable
fun JetpackJoyrideComposeEngine() {
    val player = remember { Player(x = 160f, y = 300f) }
    var frameTick by remember { mutableStateOf(0L) }

    // Declarative 60 FPS Vsync Game Loop
    LaunchedEffect(Unit) {
        var lastNano = System.nanoTime()
        while (true) {
            withFrameNanos { now ->
                val dt = ((now - lastNano) / 1_000_000_000f).coerceIn(0.001f, 0.05f)
                lastNano = now

                // Run physics step
                player.updatePhysics(dt, ceilingY = 40f, floorY = 700f)
                frameTick = now
            }
        }
    }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        player.isJetpackActive = true
                        tryAwaitRelease()
                        player.isJetpackActive = false
                    }
                )
            }
    ) {
        // Render game elements using DrawScope
        drawCircle(
            color = Color.Yellow,
            radius = 24f,
            center = Offset(player.x, player.y)
        )
    }
}
`,
    },
  ];
}
