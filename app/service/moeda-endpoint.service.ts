import { Injectable } from '@angular/core';
import axios from 'axios';
import { CotacaoForexMoedaDTO } from '../model/CotacaoForexMoedaDTO.model';

@Injectable({
  providedIn: 'root'
})
export class MoedaEndpointService {

  constructor() { }

  async buscarHistoricoMoeda(par: string, duracao: string): Promise<CotacaoForexMoedaDTO | undefined> {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${par}=X?region=US&lang=en-US&includePrePost=false&interval=${duracao}&useYfid=true&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance`);
      return response.data.chart.result[0].meta as CotacaoForexMoedaDTO;
    } catch (error) {
      console.error('Erro na requisição:', error);
      return undefined;
    }
  }
}
