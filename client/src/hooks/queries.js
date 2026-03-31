import { useQuery } from '@tanstack/react-query'
import { fetchPokemon, fetchPokemonDetails, fetchTypes } from '../api.js'

export const qk = {
  pokemon: ['pokemon'],
  types: ['types'],
  pokemonDetails: (id, lang) => ['pokemon-details', id, lang],
}

export function usePokemonList() {
  return useQuery({
    queryKey: qk.pokemon,
    queryFn: fetchPokemon,
  })
}

export function useTypesList() {
  return useQuery({
    queryKey: qk.types,
    queryFn: fetchTypes,
  })
}

export function usePokemonDetails(pokemon, lang = 'pt', enabled = true) {
  const id = pokemon?.id
  return useQuery({
    queryKey: qk.pokemonDetails(id, lang),
    queryFn: () => fetchPokemonDetails(pokemon, lang),
    enabled: enabled && Boolean(id) && Boolean(pokemon?.pokedexNumber),
    staleTime: 1000 * 60 * 60,
  })
}
