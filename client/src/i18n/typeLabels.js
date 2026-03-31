const EN_TYPES = {
  normal: 'Normal',
  fogo: 'Fire',
  agua: 'Water',
  eletrico: 'Electric',
  grama: 'Grass',
  gelo: 'Ice',
  lutador: 'Fighting',
  veneno: 'Poison',
  terra: 'Ground',
  voador: 'Flying',
  psiquico: 'Psychic',
  inseto: 'Bug',
  pedra: 'Rock',
  fantasma: 'Ghost',
  dragao: 'Dragon',
  noturno: 'Dark',
  aco: 'Steel',
  fada: 'Fairy',
}

export function getTypeLabel(type, lang = 'pt') {
  if (!type) return ''
  if (lang !== 'en') return type.name
  return EN_TYPES[type.slug] || type.name
}
