const form = document.querySelector("form")
const main = document.querySelector("main")
const amountInput = document.getElementById("draw")
const minimumInput = document.getElementById("initial")
const maximumInput = document.getElementById("final")
const uniqueResultsInput = document.getElementById("check")

// Remove caracteres que não sejam dígitos dos campos numéricos enquanto a pessoa digita.
document.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "")
    })
})

let resultCount = 0

// Intercepta o envio do formulário para validar os valores e iniciar o sorteio sem recarregar a página.
form.addEventListener("submit", (event) => {
    event.preventDefault()

    const config = readDrawConfig()
    if (config) runDraw(config)
})

// Lê e valida os campos; retorna a configuração do sorteio ou null se algum valor for inválido.
function readDrawConfig() {
    const config = {
        amount: Number(amountInput.value),
        minimum: Number(minimumInput.value),
        maximum: Number(maximumInput.value),
        unique: uniqueResultsInput.checked,
    }

    if (
        ![config.amount, config.minimum, config.maximum].every(Number.isSafeInteger) ||
        config.amount < 1 ||
        config.minimum > config.maximum
    ) {
        alert("Informe uma quantidade e um intervalo válidos.")
        return null
    }

    const rangeSize = config.maximum - config.minimum + 1
    if (!Number.isSafeInteger(rangeSize)) {
        alert("O intervalo informado é grande demais.")
        return null
    }

    if (config.unique && config.amount > rangeSize) {
        alert("A quantidade de números não pode ser maior que o intervalo sem repetição.")
        return null
    }

    return config
}

// Coordena o sorteio, atualiza o contador de resultados e trata erros inesperados.
async function runDraw(config) {
    try {
        const numbers = drawNumbers(config)
        resultCount += 1
        await renderResults(numbers, resultCount, config)
    } catch (error) {
        console.error("Falha ao realizar o sorteio:", error)
        alert("Não foi possível realizar o sorteio.")
    }
}

// Gera os resultados dentro do intervalo, com ou sem repetição conforme a configuração.
function drawNumbers({ amount, minimum, maximum, unique }) {
    const rangeSize = maximum - minimum + 1

    if (!unique) {
        return Array.from({ length: amount }, () =>
            minimum + Math.floor(Math.random() * rangeSize)
        )
    }

    // Amostra offsets únicos sem criar uma lista com todos os valores do intervalo.
    const offsets = new Set()
    for (let index = rangeSize - amount; index < rangeSize; index += 1) {
        const candidate = Math.floor(Math.random() * (index + 1))
        offsets.add(offsets.has(candidate) ? index : candidate)
    }

    return Array.from(offsets, (offset) => minimum + offset)
}

// Cria a tela de resultados, revela cada número após sua animação e adiciona a ação de novo sorteio.
async function renderResults(numbers, currentResult, config) {
    const resultArea = document.createElement("div")
    resultArea.classList.add("space", "container")

    const title = document.createElement("h1")
    title.classList.add("result")
    title.textContent = "Resultado do sorteio"

    const subtitle = document.createElement("h2")
    subtitle.classList.add("sub-title")
    subtitle.textContent = `${currentResult}º resultado`

    const numberList = document.createElement("div")
    numberList.classList.add("div-sorted-numbers")
    numberList.setAttribute("aria-live", "polite")

    resultArea.append(title, subtitle, numberList)
    main.classList.remove("grid")
    main.replaceChildren(resultArea)

    for (const number of numbers) {
        const animationContainer = document.createElement("div")
        animationContainer.classList.add("animation-number")

        const numberElement = document.createElement("span")
        numberElement.classList.add("number-sorted")
        numberElement.textContent = number

        animationContainer.append(numberElement)
        numberList.append(animationContainer)
        await waitForAnimations(animationContainer)
    }

    const redrawButton = document.createElement("button")
    redrawButton.type = "button"
    redrawButton.classList.add("appear-button")
    redrawButton.append("SORTEAR NOVAMENTE ")

    const buttonIcon = document.createElement("img")
    buttonIcon.src = "./assets/Frame.svg"
    buttonIcon.alt = ""
    redrawButton.append(buttonIcon)
    redrawButton.addEventListener("click", () => runDraw(config))

    main.append(redrawButton)
    requestAnimationFrame(() => redrawButton.classList.add("is-visible"))
}

// Aguarda as animações CSS do elemento; também resolve se uma animação for cancelada ou não existir.
function waitForAnimations(element) {
    const animations = element.getAnimations()
    return Promise.all(animations.map((animation) => animation.finished.catch(() => {})))
}
