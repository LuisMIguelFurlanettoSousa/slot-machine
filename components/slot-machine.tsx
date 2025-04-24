"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { BarChart, DollarSign, Settings, RotateCcw, Play } from "lucide-react"

const SYMBOLS = {
  money_mouth_face: "🤑",
  cold_face: "🥶",
  alien: "👽",
  heart_on_fire: "❤️‍🔥",
  collision: "💥",
}

const SYMBOL_KEYS = Object.keys(SYMBOLS)

interface GameStats {
  gamesPlayed: number
  wins: number
  losses: number
  biggestWin: number
  totalWagered: number
  totalWon: number
}

export default function SlotMachine() {
  const [playerBalance, setPlayerBalance] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("playerBalance")
      return saved ? Number.parseInt(saved) : 1000
    }
    return 1000
  })

  const [machineBalance, setMachineBalance] = useState(5000)
  const [betAmount, setBetAmount] = useState(10)
  const [reels, setReels] = useState([
    [SYMBOL_KEYS[0], SYMBOL_KEYS[0], SYMBOL_KEYS[0]],
    [SYMBOL_KEYS[1], SYMBOL_KEYS[1], SYMBOL_KEYS[1]],
    [SYMBOL_KEYS[2], SYMBOL_KEYS[2], SYMBOL_KEYS[2]],
  ])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [level, setLevel] = useState(1)
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    biggestWin: 0,
    totalWagered: 0,
    totalWon: 0,
  })

  // Load stats from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStats = localStorage.getItem("gameStats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
    }
  }, [])

  // Save player balance and stats to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playerBalance", playerBalance.toString())
      localStorage.setItem("gameStats", JSON.stringify(stats))
    }
  }, [playerBalance, stats])

  const generatePermutations = () => {
    const permutations = []

    // Generate all possible combinations
    for (let i = 0; i < SYMBOL_KEYS.length; i++) {
      for (let j = 0; j < SYMBOL_KEYS.length; j++) {
        for (let k = 0; k < SYMBOL_KEYS.length; k++) {
          permutations.push([SYMBOL_KEYS[i], SYMBOL_KEYS[j], SYMBOL_KEYS[k]])
        }
      }
    }

    // Add winning combinations based on level
    for (let l = 0; l < level; l++) {
      for (let i = 0; i < SYMBOL_KEYS.length; i++) {
        permutations.push([SYMBOL_KEYS[i], SYMBOL_KEYS[i], SYMBOL_KEYS[i]])
      }
    }

    return permutations
  }

  const getFinalResult = () => {
    const permutations = generatePermutations()
    const result = [...permutations[Math.floor(Math.random() * permutations.length)]]

    // Increase chance of getting two matching symbols
    if (new Set(result).size === 3 && Math.random() * 5 >= 2) {
      result[1] = result[0]
    }

    return result
  }

  const checkResult = (result: string[]) => {
    return result[0] === result[1] && result[1] === result[2]
  }

  const updateBalance = (result: string[]) => {
    const isWin = checkResult(result)
    const winAmount = betAmount * 3

    if (isWin) {
      setPlayerBalance((prev) => prev + winAmount)
      setMachineBalance((prev) => prev - winAmount)
      setMessage(`Você venceu e recebeu: ${winAmount}!`)

      // Update stats
      setStats((prev) => ({
        ...prev,
        wins: prev.wins + 1,
        biggestWin: Math.max(prev.biggestWin, winAmount),
        totalWon: prev.totalWon + winAmount,
      }))
    } else {
      setPlayerBalance((prev) => prev - betAmount)
      setMachineBalance((prev) => prev + betAmount)
      setMessage("Foi quase, tente novamente")

      // Update stats
      setStats((prev) => ({
        ...prev,
        losses: prev.losses + 1,
      }))
    }

    // Update general stats
    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalWagered: prev.totalWagered + betAmount,
    }))
  }

  const spinReels = async () => {
    if (spinning || playerBalance < betAmount) return

    setSpinning(true)
    setMessage("")

    const finalResult = getFinalResult()
    setResult(finalResult)

    // Animate each reel with different timing
    const reelPromises = reels.map(async (_, reelIndex) => {
      const steps = 15 + Math.floor(Math.random() * 10)
      const baseDelay = 50
      let currentDelay = baseDelay

      for (let step = 0; step < steps; step++) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay))

        setReels((prevReels) => {
          const newReels = [...prevReels]
          newReels[reelIndex] = SYMBOL_KEYS.map(() => SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)])
          return newReels
        })

        // Increase delay for slowing down effect
        currentDelay += baseDelay * 0.2
      }

      // Set final symbol for this reel
      setReels((prevReels) => {
        const newReels = [...prevReels]
        newReels[reelIndex] = [finalResult[reelIndex], finalResult[reelIndex], finalResult[reelIndex]]
        return newReels
      })

      return true
    })

    // Wait for all reels to stop
    await Promise.all([
      reelPromises[0],
      new Promise((resolve) => setTimeout(resolve, 500)).then(() => reelPromises[1]),
      new Promise((resolve) => setTimeout(resolve, 1000)).then(() => reelPromises[2]),
    ])

    updateBalance(finalResult)
    setSpinning(false)
  }

  const resetGame = () => {
    if (window.confirm("Tem certeza que deseja reiniciar o jogo? Seu saldo e estatísticas serão redefinidos.")) {
      setPlayerBalance(1000)
      setMachineBalance(5000)
      setStats({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        biggestWin: 0,
        totalWagered: 0,
        totalWon: 0,
      })
      setMessage("")
      localStorage.removeItem("playerBalance")
      localStorage.removeItem("gameStats")
    }
  }

  const addFunds = () => {
    const amount = window.prompt("Quanto você deseja adicionar ao seu saldo?")
    if (amount && !isNaN(Number(amount))) {
      setPlayerBalance((prev) => prev + Number(amount))
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <Tabs defaultValue="game" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="game">Jogo</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-4">
          <div className="flex justify-between mb-4">
            <Card className="w-[48%]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium">Seu Saldo</span>
                </div>
                <span className="text-xl font-bold">{playerBalance}</span>
              </CardContent>
            </Card>

            <Card className="w-[48%]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium">Saldo Máquina</span>
                </div>
                <span className="text-xl font-bold">{machineBalance}</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-purple-800 to-purple-900 border-2 border-yellow-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[0, 1, 2].map((reelIndex) => (
                  <div key={reelIndex} className="bg-black rounded-lg p-2 h-60 overflow-hidden">
                    <div className="flex flex-col items-center justify-center h-full">
                      {reels[reelIndex].map((symbol, symbolIndex) => (
                        <div key={symbolIndex} className="text-6xl mb-4 transition-all duration-100">
                          {SYMBOLS[symbol as keyof typeof SYMBOLS]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {message && (
                <div
                  className={`text-center p-2 mb-4 rounded-md ${message.includes("venceu") ? "bg-green-800 text-white" : "bg-red-800 text-white"}`}
                >
                  {message}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-white">Aposta:</span>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((prev) => Math.max(1, prev - 5))}
                      disabled={spinning}
                    >
                      -
                    </Button>
                    <span className="mx-2 text-white font-bold">{betAmount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((prev) => Math.min(100, prev + 5))}
                      disabled={spinning}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6"
                  onClick={spinReels}
                  disabled={spinning || playerBalance < betAmount}
                >
                  {spinning ? (
                    <div className="flex items-center">
                      <span className="animate-spin mr-2">🎰</span>
                      Girando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Play className="mr-2 h-5 w-5" />
                      Girar
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={addFunds}>
              Adicionar Fundos
            </Button>
            <Button variant="destructive" onClick={resetGame}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar Jogo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Estatísticas de Jogo
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Jogos Realizados</p>
                  <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
                  <p className="text-2xl font-bold">
                    {stats.gamesPlayed > 0 ? `${Math.round((stats.wins / stats.gamesPlayed) * 100)}%` : "0%"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Vitórias</p>
                  <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Derrotas</p>
                  <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Maior Vitória</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.biggestWin}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Apostado</p>
                  <p className="text-2xl font-bold">{stats.totalWagered}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Retorno ao Jogador (RTP)</p>
                  <p className="text-sm font-medium">
                    {stats.totalWagered > 0 ? `${Math.round((stats.totalWon / stats.totalWagered) * 100)}%` : "0%"}
                  </p>
                </div>
                <Progress
                  value={stats.totalWagered > 0 ? (stats.totalWon / stats.totalWagered) * 100 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-xl font-bold flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Configurações
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Nível de Dificuldade</label>
                    <span className="text-sm">{level}</span>
                  </div>
                  <Slider value={[level]} min={1} max={5} step={1} onValueChange={(value) => setLevel(value[0])} />
                  <p className="text-xs text-muted-foreground">Níveis mais altos aumentam suas chances de ganhar.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Símbolos do Jogo</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(SYMBOLS).map(([key, symbol]) => (
                      <div key={key} className="bg-muted rounded-md p-2 text-center">
                        <div className="text-3xl">{symbol}</div>
                        <div className="text-xs mt-1 truncate">{key.replace(/_/g, " ")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={resetGame}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reiniciar Jogo e Estatísticas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
