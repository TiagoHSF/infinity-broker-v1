import { Component, OnInit } from "@angular/core";
import { OperacaoDTO } from "../model/OperacaoDTO.model";
import axios from "axios";
import { parse } from "node-html-parser/dist/nodes/html";
import { HTMLElement } from "node-html-parser";
import { MoedaEndpointService } from "../service/moeda-endpoint.service";
import { ParDTO } from "../model/ParDTO.model";

@Component({
  selector: "app-main-operation",
  templateUrl: "./main-operation.component.html",
  styleUrls: ["./main-operation.component.scss"],
})
export class MainOperationComponent implements OnInit {
  
  analisando = false;

  // pares: ParDTO[] = [];
  pares = ['EUR/USD', 'CAD/JPY', 'EUR/JPY']

  periodo = [
    '1m',
    '2m',
    '5m',
    '15m',
    '30m',
    '60m',
    '90m',
    '1h',
    '1d',
    '5d',
    '1wk',
    '1mo',
    '3mo',
  ];

  parSelecionado: any;
  tempoSelecionado: any;

  possivelEntrada: boolean = false;

  analises: number = 0;

  constructor(private moedaEndpointService: MoedaEndpointService) {}

  ngOnInit(): void {
    // const url =
    //   "wss://feeds.leadercapital.net/signalR/signalr/connect?transport=webSockets&clientProtocol=1.5&connectionToken=3NMT1x3w4yQDkMI5OHwswk0%2Bl0%2BJz0wfFgO2KX00O4R5oxkAouyaAF1RGICqHG6RTUcbwO8vLPtFHoAEVLlUcwYISfmExkt8Dblz%2FeS%2FW5wRnP0D%2FNbO3NtvcEq68WIW&connectionData=%5B%7B%22name%22%3A%22quoteshub%22%7D%5D&tid=0";

    // const socket = new WebSocket(url);

    // socket.addEventListener("open", () => {
    //   console.log("Conexão estabelecida");
    //   socket.send("Olá, servidor!");
    // });

    // socket.addEventListener("message", (event) => {
    //   this.pares = [];
    //   const parsedObject = JSON.parse(event.data);
    //   for (let moeda of parsedObject.M[0]["A"][0]) {
    //     if(moeda.Symbol == 'EURUSD' ||
    //     moeda.Symbol == 'GBPUSD' ||
    //     moeda.Symbol == 'USDJPY' ||
    //     moeda.Symbol == 'USDCHF' ||
    //     moeda.Symbol == 'AUDUSD' ||
    //     moeda.Symbol == 'USDCAD' ||
    //     moeda.Symbol == 'NZDUSD'){
    //       let par = {
    //         price: moeda.Buy,
    //         moment: moeda.Time,
    //         symbol: moeda.Symbol,
    //         dailyHigh: moeda.DailyHigh,
    //         dailyLow: moeda.DailyLow,
    //       } as ParDTO;
    //       this.pares.push(par)
    //     }
    //   }
    // });

    // // socket.addEventListener('close', () => {
    // //   console.log('Conexão fechada');
    // // });
  }

  resultadoOperacao: [string, number] | undefined;
  tempoPara: Date = new Date();

  historicoMoeda: OperacaoDTO[] = [];

  determinarChanceCallPut(): void {
    setInterval(() => {
      if (!this.possivelEntrada) {
        this.analises = this.analises + 1;
        this.analisando = true;

        this.parSelecionado = this.parSelecionado.replace(/[^a-zA-Z0-9]/g, "");

        this.moedaEndpointService
          .buscarHistoricoMoeda(this.parSelecionado, this.tempoSelecionado)
          .then((result) => {
            let valorMoedaTeste = 0;
            if (result != undefined) {
              valorMoedaTeste = result?.regularMarketPrice;
            }
            const moedaAtual = {
              valor: valorMoedaTeste,
              data: new Date(),
              volume: 0,
            } as OperacaoDTO;
            this.historicoMoeda.push(moedaAtual);
          });

        const ultimoValor = this.historicoMoeda[this.historicoMoeda.length - 1];
        this.tempoPara = ultimoValor.data;
        let chance: string;
        let probabilidade: number;

        // Verificar se há informações suficientes no histórico
        if (this.historicoMoeda.length < 2) {
          chance = "Indeterminado";
          probabilidade = 0.5;
        } else {
          const tendenciaAtual = this.calcularTendenciaAtual();
          const tendenciaAnterior = this.calcularTendenciaAnterior();
          const rsi = this.calcularRSI();
          const mfi = this.calcularMFI();
          const bandasBollinger = this.calcularBandasBollinger();
          const macd = this.calcularMACD();

          // Aplicar técnicas e regras de análise para determinar a chance de Call ou Put
          if (
            tendenciaAtual === "Alta" &&
            tendenciaAnterior === "Alta" &&
            rsi > 70 &&
            mfi > 80 &&
            bandasBollinger === "Sobrecompra" &&
            macd === "Sinal de Venda"
          ) {
            chance = "Put";
            probabilidade = 0; // Exemplo de probabilidade alta em uma tendência de alta contínua com indicadores adicionais
          } else if (
            tendenciaAtual === "Baixa" &&
            tendenciaAnterior === "Baixa" &&
            rsi < 30 &&
            mfi < 20 &&
            bandasBollinger === "Sobrevenda" &&
            macd === "Sinal de Compra"
          ) {
            chance = "Call";
            probabilidade = 0; // Exemplo de probabilidade alta em uma tendência de baixa contínua com indicadores adicionais
          } else {
            chance = "Indeterminado";
            probabilidade = 0;
          }
        }

        this.resultadoOperacao = [chance, probabilidade];
        if (chance != "Indeterminado") {
          this.possivelEntrada = true;
        }
      }
    }, 10000);
  }

  private calcularTendenciaAtual(): "Alta" | "Baixa" | "Neutra" {
    // Calcular a média móvel simples (SMA) para o período desejado
    const periodoSMA = 5; // Número de períodos para a média móvel simples
    const valores = this.historicoMoeda
      .slice(-periodoSMA)
      .map((operacao) => operacao.valor);
    const mediaSMA =
      valores.reduce((total, valor) => total + valor, 0) / periodoSMA;
    const valorAtual =
      this.historicoMoeda[this.historicoMoeda.length - 1].valor;

    // Determinar a tendência com base na comparação entre o valor atual e a média móvel
    if (valorAtual > mediaSMA) {
      return "Alta";
    } else if (valorAtual < mediaSMA) {
      return "Baixa";
    } else {
      return "Neutra";
    }
  }

  private calcularTendenciaAnterior(): "Alta" | "Baixa" | "Neutra" {
    const periodoSMA = 5; // Número de períodos para a média móvel simples
    const valores = this.historicoMoeda
      .slice(-periodoSMA * 2, -periodoSMA)
      .map((operacao) => operacao.valor);
    const mediaSMA =
      valores.reduce((total, valor) => total + valor, 0) / periodoSMA;
    const valorAnterior =
      this.historicoMoeda[this.historicoMoeda.length - 2].valor;

    if (valorAnterior > mediaSMA) {
      return "Alta";
    } else if (valorAnterior < mediaSMA) {
      return "Baixa";
    } else {
      return "Neutra";
    }
  }

  private calcularRSI(): number {
    const periodoRSI = 14; // Número de períodos para o cálculo do RSI
    const valores = this.historicoMoeda
      .slice(-periodoRSI - 1, -1)
      .map((operacao) => operacao.valor);
    const ganhos = [];
    const perdas = [];

    for (let i = 1; i < valores.length; i++) {
      const diferenca = valores[i] - valores[i - 1];
      if (diferenca > 0) {
        ganhos.push(diferenca);
        perdas.push(0);
      } else if (diferenca < 0) {
        ganhos.push(0);
        perdas.push(Math.abs(diferenca));
      } else {
        ganhos.push(0);
        perdas.push(0);
      }
    }

    const mediaGanhos =
      ganhos.reduce((total, ganho) => total + ganho, 0) / periodoRSI;
    const mediaPerdas =
      perdas.reduce((total, perda) => total + perda, 0) / periodoRSI;
    const rs = mediaGanhos / mediaPerdas;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  private calcularMFI(): number {
    const periodoMFI = 14; // Número de períodos para o cálculo do MFI
    const valores = this.historicoMoeda.slice(-periodoMFI);
    let fluxoPositivo = 0;
    let fluxoNegativo = 0;

    for (let i = 1; i < valores.length; i++) {
      const valorAtual = valores[i].valor;
      const valorAnterior = valores[i - 1].valor;
      const volume = valores[i].volume;

      if (valorAtual > valorAnterior) {
        fluxoPositivo += valorAtual * volume;
      } else if (valorAtual < valorAnterior) {
        fluxoNegativo += valorAtual * volume;
      }
    }

    const moneyRatio = fluxoPositivo / fluxoNegativo || 0;
    const mfi = 100 - 100 / (1 + moneyRatio);

    return mfi;
  }

  private calcularBandasBollinger(): "Sobrecompra" | "Sobrevenda" | "Neutra" {
    const periodoBB = 20; // Número de períodos para o cálculo das Bandas de Bollinger
    const desvioPadrao = this.calcularDesvioPadrao(periodoBB);
    let valores: number[] = [];
    this.historicoMoeda.forEach((item) => {
      valores.push(item.valor);
    });
    const media = this.calcularMedia(periodoBB, valores);
    const valorAtual =
      this.historicoMoeda[this.historicoMoeda.length - 1].valor;

    const bandaSuperior = media + 2 * desvioPadrao;
    const bandaInferior = media - 2 * desvioPadrao;

    if (valorAtual > bandaSuperior) {
      return "Sobrecompra";
    } else if (valorAtual < bandaInferior) {
      return "Sobrevenda";
    } else {
      return "Neutra";
    }
  }

  private calcularMACD(): "Sinal de Compra" | "Sinal de Venda" | "Neutro" {
    const periodoCurto = 12; // Período curto para o cálculo do MACD
    const periodoLongo = 26; // Período longo para o cálculo do MACD
    const periodoSinal = 9; // Período para o cálculo do sinal do MACD

    const valores = this.historicoMoeda
      .slice(-periodoLongo - periodoSinal)
      .map((operacao) => operacao.valor);

    const valoresCurto = valores.slice(-periodoCurto);
    const valoresLongo = valores.slice(-periodoLongo);

    const mediaCurto = this.calcularMedia(periodoCurto, valoresCurto);
    const mediaLongo = this.calcularMedia(periodoLongo, valoresLongo);

    const macd = mediaCurto - mediaLongo;

    const valoresSinal = valores.slice(-periodoSinal);
    const mediaSinal = this.calcularMedia(periodoSinal, valoresSinal);

    if (macd > mediaSinal) {
      return "Sinal de Compra";
    } else if (macd < mediaSinal) {
      return "Sinal de Venda";
    } else {
      return "Neutro";
    }
  }

  private calcularDesvioPadrao(periodo: number): number {
    const valores = this.historicoMoeda
      .slice(-periodo)
      .map((operacao) => operacao.valor);
    const media = this.calcularMedia(periodo, valores);

    const somaDiferencasQuadrado = valores.reduce(
      (total, valor) => total + Math.pow(valor - media, 2),
      0
    );
    const variancia = somaDiferencasQuadrado / periodo;
    const desvioPadrao = Math.sqrt(variancia);

    return desvioPadrao;
  }

  private calcularMedia(periodo: number, valores: number[]): number {
    const soma = valores.reduce((total, valor) => total + valor, 0);
    const media = soma / periodo;

    return media;
  }

  disableAnalise(): boolean {
    if (this.parSelecionado != null && this.tempoSelecionado != null) {
      return false;
    }
    return true;
  }

  pausarAnalise() {
    this.analisando = false;
    this.resultadoOperacao = undefined;
    this.parSelecionado = "";
    this.tempoSelecionado = "";
    this.analises = 0;
  }

  continuarAnalise() {
    this.possivelEntrada = false;
    this.historicoMoeda = [];
  }
}
