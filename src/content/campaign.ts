export type CampaignRegion = 'ofra' | 'altar' | 'harode' | 'midian';
export type DialogueLine = { speaker: string; text: string };
export type CampaignStep = {
  stage: number;
  act: 1 | 2 | 3 | 4;
  region: CampaignRegion;
  title: string;
  objective: string;
  reference: string;
  targetId: string;
  kind: 'dialogue' | 'battle' | 'cinematic' | 'stealth';
  dialogue: DialogueLine[];
  adaptation: string;
  cinematic?: 'intro' | 'altar' | 'army' | 'recon' | 'dream' | 'distribution' | 'trumpets' | 'ending';
};

export const adaptationNotice = 'Adaptação de Juízes 6–8. Falas em português contemporâneo são paráfrases autorais, conferidas na Almeida Revista e Corrigida (2009); não são citações literais. Cenários, rotinas e combates secundários são reconstruções artísticas.';

export const introDialogue: DialogueLine[] = [
  { speaker: 'Narrador · Juízes 6:1–6', text: 'Israel abandonou o Senhor. Durante sete anos, os invasores devastaram suas colheitas. Famílias se abrigavam nas montanhas, e a fome crescia.' },
  { speaker: 'Narrador · Juízes 6:7–10', text: 'Quando Israel clamou, o Senhor enviou um profeta para recordar sua libertação e denunciar a desobediência do povo.' },
  { speaker: 'Narrador · Juízes 6:11', text: 'Em Ofra, Gideão, filho de Joás, tenta salvar um pouco de trigo. Trabalha escondido em um lagar.' },
];

export const campaign: CampaignStep[] = [
  {
    stage: 0, act: 1, region: 'ofra', title: 'O homem no lagar',
    objective: 'Aproxime-se do lagar e acompanhe o chamado de Gideão.',
    reference: 'Juízes 6:1–24', targetId: 'lagar', kind: 'cinematic', cinematic: 'intro',
    adaptation: 'O chamado, a oferta consumida e o altar da paz pertencem ao relato bíblico. A encenação e todas as falas são adaptadas.',
    dialogue: [
      { speaker: 'Anjo do Senhor · paráfrase', text: 'O Senhor está com você, Gideão. Ele o envia para libertar Israel.' },
      { speaker: 'Gideão · paráfrase', text: 'Se o Senhor está conosco, por que sofremos assim? Minha família é fraca, e eu sou o menor em casa.' },
      { speaker: 'Senhor · paráfrase', text: 'Eu estarei com você. A libertação não depende de sua grandeza.' },
      { speaker: 'Narrador', text: 'Gideão prepara uma oferta. O Anjo toca a carne e os pães; o fogo os consome, e ele desaparece. Gideão teme morrer, mas recebe uma palavra de paz.' },
      { speaker: 'Gideão · paráfrase', text: 'Erguerei aqui um altar ao Senhor. O Senhor é paz.' },
      { speaker: 'Objetivo · reconstrução artística', text: 'Antes da noite, veja as famílias junto ao celeiro. Caminhe por Ofra e prepare seus equipamentos.' },
    ],
  },
  {
    stage: 1, act: 1, region: 'ofra', title: 'O trigo de Ofra',
    objective: 'Converse com a moradora ao lado do celeiro.', reference: 'Contexto: Juízes 6:3–6',
    targetId: 'celeiro', kind: 'dialogue',
    adaptation: 'A moradora e esta missão são ficcionais. A perda das colheitas é bíblica.',
    dialogue: [
      { speaker: 'Moradora · personagem ficcional', text: 'Guardamos o que restou junto ao celeiro. Há uma patrulha na trilha dos campos; não conseguimos buscar os últimos sacos.' },
      { speaker: 'Gideão · fala ficcional', text: 'Vou verificar o caminho. Fiquem perto das casas.' },
      { speaker: 'Moradora · personagem ficcional', text: 'Leve provisões e confira sua proteção. A estrada exige cuidado.' },
    ],
  },
  {
    stage: 2, act: 1, region: 'ofra', title: 'A trilha dos campos',
    objective: 'Encontre a patrulha nos campos e vença o confronto tático.', reference: 'Reconstrução artística no contexto de Juízes 6:3–6',
    targetId: 'patrulha', kind: 'battle',
    adaptation: 'Esta patrulha, os aliados e o confronto são ficcionais; não representam um episódio narrado nas Escrituras.',
    dialogue: [
      { speaker: 'Narrador · reconstrução artística', text: 'Uma pequena patrulha ameaça a passagem. Gideão e os defensores locais protegem a retirada dos trabalhadores.' },
      { speaker: 'Aliado · personagem ficcional', text: 'Observe quem prepara o golpe. Defenda, preserve o vigor e concentre nossos ataques.' },
      { speaker: 'Gideão · fala ficcional', text: 'O caminho está livre. Retornemos às famílias antes de escurecer.' },
    ],
  },
  {
    stage: 3, act: 2, region: 'altar', title: 'A noite dos altares',
    objective: 'Alcance o altar de Baal com os dez servos e execute a ordem.', reference: 'Juízes 6:25–27',
    targetId: 'altar-baal', kind: 'cinematic', cinematic: 'altar',
    adaptation: 'A ação noturna, o medo de Gideão e os dez servos são bíblicos. A rota, a observação das rondas e os gestos são encenação.',
    dialogue: [
      { speaker: 'Narrador · paráfrase', text: 'O Senhor ordena: derrubar o altar de Baal de seu pai, cortar o poste-ídolo e construir um altar ao Senhor no alto.' },
      { speaker: 'Gideão · fala adaptada', text: 'Ainda tenho medo da minha família e dos homens da cidade. Iremos durante a noite. Os dez servos virão comigo.' },
      { speaker: 'Narrador', text: 'Juntos, eles derrubam o altar, cortam o poste e erguem o novo altar. Oferecem o segundo boi, de sete anos, usando a madeira do poste.' },
    ],
  },
  {
    stage: 4, act: 2, region: 'altar', title: 'Que Baal se defenda',
    objective: 'Encontre Joás e acompanhe a reação da aldeia.', reference: 'Juízes 6:28–32',
    targetId: 'joas', kind: 'dialogue',
    adaptation: 'A ameaça da cidade e a intervenção de Joás são bíblicas. Não há combate contra os moradores.',
    dialogue: [
      { speaker: 'Narrador', text: 'Ao amanhecer, descobrem o altar destruído. A multidão exige que Joás entregue Gideão para morrer.' },
      { speaker: 'Joás · paráfrase', text: 'Vocês precisam defender Baal? Se ele é deus, que defenda o próprio altar.' },
      { speaker: 'Narrador', text: 'Por isso, Gideão recebe o nome Jerubaal: que Baal contenda contra ele.' },
    ],
  },
  {
    stage: 5, act: 2, region: 'altar', title: 'O orvalho e a lã',
    objective: 'Vá à eira e acompanhe os sinais da lã.', reference: 'Juízes 6:33–40',
    targetId: 'la', kind: 'cinematic',
    adaptation: 'Os sinais são narrados como ação de Deus; não são desafio, receita para pedir sinais ou recurso de combate.',
    dialogue: [
      { speaker: 'Narrador', text: 'Os exércitos inimigos se reúnem no vale de Jezreel. O Espírito do Senhor reveste Gideão; sua trombeta convoca os abiezritas, e mensageiros chamam as tribos.' },
      { speaker: 'Gideão · paráfrase', text: 'Deus, confirma tua promessa: que o orvalho esteja na lã, enquanto o chão permanece seco.' },
      { speaker: 'Narrador', text: 'Pela manhã, isso acontece. Ainda inseguro, Gideão pede o inverso. Na noite seguinte, só a lã fica seca, e o chão recebe o orvalho.' },
    ],
  },
  {
    stage: 6, act: 3, region: 'harode', title: 'À fonte de Harode',
    objective: 'Converse no acampamento e acompanhe a primeira redução do exército.', reference: 'Juízes 7:1–3',
    targetId: 'comandante', kind: 'cinematic', cinematic: 'army',
    adaptation: 'A contagem representa os números do texto; personagens visíveis simbolizam contingentes maiores.',
    dialogue: [
      { speaker: 'Narrador', text: 'Trinta e dois mil homens se reúnem perto da fonte de Harode. No vale ao norte, o exército de Midiã cobre a paisagem.' },
      { speaker: 'Senhor · paráfrase', text: 'Há gente demais. Israel não deve atribuir sua libertação à própria força. Que os temerosos retornem.' },
      { speaker: 'Narrador', text: 'Vinte e dois mil voltam para casa. Permanecem dez mil. A segurança de Gideão não pode repousar no tamanho do exército.' },
    ],
  },
  {
    stage: 7, act: 3, region: 'harode', title: 'Somente trezentos',
    objective: 'Vá à fonte para acompanhar a seleção narrada no texto.', reference: 'Juízes 7:4–8',
    targetId: 'fonte', kind: 'cinematic', cinematic: 'army',
    adaptation: 'O modo de beber não mede a espiritualidade dos homens. O jogador não escolhe soldados nem resolve um minijogo.',
    dialogue: [
      { speaker: 'Narrador', text: 'O Senhor manda Gideão conduzir os homens às águas. Trezentos levam a água com a mão até a boca. Os demais se ajoelham para beber.' },
      { speaker: 'Senhor · paráfrase', text: 'Por meio destes trezentos, eu libertarei vocês. Os outros podem voltar.' },
      { speaker: 'Narrador', text: 'Os trezentos ficam com as provisões e as trombetas. A vitória será recebida do Senhor, e não produzida por superioridade numérica.' },
    ],
  },
  {
    stage: 8, act: 3, region: 'harode', title: 'Gideão e Purá',
    objective: 'Fale com Purá e siga com ele para o reconhecimento noturno.', reference: 'Juízes 7:9–12',
    targetId: 'pura', kind: 'dialogue', cinematic: 'recon',
    adaptation: 'Purá é mencionado na passagem. Rotas, coberturas, percepção e falas de apoio são reconstrução de gameplay.',
    dialogue: [
      { speaker: 'Narrador', text: 'Naquela noite, o Senhor orienta Gideão a descer ao acampamento. Se ainda tem medo, pode levar seu servo Purá e ouvir os inimigos.' },
      { speaker: 'Purá · fala ficcional', text: 'Eu vou com você. Vamos por onde as rochas nos escondem. Observe as sentinelas antes de atravessar a luz.' },
      { speaker: 'Gideão · fala ficcional', text: 'Iremos à borda do acampamento. Escutaremos e voltaremos aos nossos homens.' },
    ],
  },
  {
    stage: 9, act: 3, region: 'midian', title: 'O sonho do pão de cevada',
    objective: 'Evite as sentinelas e alcance a tenda para ouvir a conversa.', reference: 'Juízes 7:13–15',
    targetId: 'sonho', kind: 'stealth', cinematic: 'dream',
    adaptation: 'O sonho e sua interpretação são bíblicos. Não é uma charada: basta alcançar a conversa sem ser visto.',
    dialogue: [
      { speaker: 'Soldado midianita · paráfrase', text: 'Sonhei com um pão de cevada rolando para dentro do acampamento. Ele atingiu uma tenda e a derrubou.' },
      { speaker: 'Outro soldado · paráfrase', text: 'Isso significa Gideão, filho de Joás. Deus entregou Midiã e este acampamento nas mãos dele.' },
      { speaker: 'Narrador', text: 'Gideão ouve, se prostra em adoração e retorna aos israelitas. Seu ânimo é fortalecido pelo que Deus lhe permite ouvir.' },
    ],
  },
  {
    stage: 10, act: 4, region: 'midian', title: 'Três companhias',
    objective: 'Encontre a companhia e prepare as trombetas, os cântaros e as tochas.', reference: 'Juízes 7:16–18',
    targetId: 'companhia', kind: 'cinematic', cinematic: 'distribution',
    adaptation: 'Os trezentos divididos em três grupos e seus instrumentos são bíblicos. A área compacta representa a borda do vale e o retorno dos batedores.',
    dialogue: [
      { speaker: 'Gideão · paráfrase', text: 'Levantem-se. O Senhor nos entregou o acampamento de Midiã. Dividam os trezentos em três companhias.' },
      { speaker: 'Narrador', text: 'Cada homem recebe uma trombeta, um cântaro vazio e uma tocha acesa dentro dele.' },
      { speaker: 'Gideão · paráfrase', text: 'Observem o que eu fizer e façam o mesmo. Quando soar nossa trombeta, as outras companhias responderão ao redor do acampamento.' },
    ],
  },
  {
    stage: 11, act: 4, region: 'midian', title: 'A noite das tochas',
    objective: 'Alcance a posição marcada e dê o sinal às três companhias.', reference: 'Juízes 7:19–22',
    targetId: 'sinal', kind: 'cinematic', cinematic: 'trumpets',
    adaptation: 'A interação acompanha um sinal coordenado. O Senhor causa a confusão; Gideão não lança poderes nem vence por magia.',
    dialogue: [
      { speaker: 'Narrador', text: 'Na troca da guarda, Gideão e seus cem homens chegam à borda do acampamento. As três companhias ocupam seus lugares.' },
      { speaker: 'Gideão · sinal adaptado', text: 'Agora! Toquem as trombetas, quebrem os cântaros e ergam as tochas!' },
      { speaker: 'Os trezentos · grito adaptado', text: 'Pelo Senhor e por Gideão!' },
      { speaker: 'Narrador', text: 'Cada homem permanece em seu lugar. O inimigo grita e foge. O Senhor faz os homens do acampamento voltarem suas espadas uns contra os outros.' },
    ],
  },
  {
    stage: 12, act: 4, region: 'midian', title: 'A passagem do vale',
    objective: 'Proteja seus aliados contra a unidade em retirada.', reference: 'Reconstrução artística durante a dispersão de Juízes 7:22–25',
    targetId: 'unidade', kind: 'battle',
    adaptation: 'A unidade e seu capitão são ficcionais, sem identidade bíblica. Este encontro complementa a retirada e não causa a vitória descrita em Juízes.',
    dialogue: [
      { speaker: 'Narrador · reconstrução artística', text: 'A vitória já rompeu o acampamento. Uma unidade em retirada bloqueia a passagem de alguns aliados. Este encontro é uma reconstrução artística.' },
      { speaker: 'Purá · fala ficcional', text: 'O escudeiro protege o capitão. Rompa a postura deles e cubra quem estiver ferido.' },
      { speaker: 'Gideão · fala ficcional', text: 'Permaneçam juntos. Abriremos a passagem e reuniremos os nossos.' },
    ],
  },
  {
    stage: 13, act: 4, region: 'midian', title: 'A quem pertence a vitória',
    objective: 'Reúna o grupo para o encerramento e o epílogo.', reference: 'Juízes 7:23–25; 8:1–35',
    targetId: 'epilogo', kind: 'cinematic', cinematic: 'ending',
    adaptation: 'O epílogo resume acontecimentos posteriores. A perseguição e os episódios de Juízes 8 não são transformados em aprovação de todas as decisões de Gideão.',
    dialogue: [
      { speaker: 'Narrador', text: 'Outras tribos se juntam à perseguição. Efraim toma as passagens do Jordão e captura Orebe e Zeebe. Mais tarde, Gideão alcança Zeba e Salmuna.' },
      { speaker: 'Narrador', text: 'O capítulo seguinte também relata conflitos, vingança e mortes em Sucote e Penuel. A libertação de Israel não torna Gideão um homem sem falhas.' },
      { speaker: 'Gideão · paráfrase de Juízes 8:23', text: 'Não serei rei de vocês, nem meu filho. O Senhor deve governá-los.' },
      { speaker: 'Narrador', text: 'Contudo, Gideão faz um éfode com o ouro recolhido. Israel passa a se desviar por causa dele; o objeto se torna uma armadilha para Gideão e sua casa.' },
      { speaker: 'Narrador', text: 'A terra descansa por quarenta anos. Depois da morte de Gideão, Israel volta à idolatria e esquece o Deus que o libertou. A esperança permanece no Senhor.' },
    ],
  },
];

export const acts = [
  { id: 1, title: 'O homem no lagar', region: 'ofra', subtitle: 'Ofra · os campos de Manassés', reference: 'Juízes 6:1–24' },
  { id: 2, title: 'A noite dos altares', region: 'altar', subtitle: 'Ofra · o alto da aldeia', reference: 'Juízes 6:25–40' },
  { id: 3, title: 'Os trezentos', region: 'harode', subtitle: 'A fonte de Harode', reference: 'Juízes 7:1–15' },
  { id: 4, title: 'A noite das tochas', region: 'midian', subtitle: 'O vale de Jezreel', reference: 'Juízes 7:16–25; 8' },
] as const;

export const biblicalReferences = [
  { title: 'A opressão e o chamado', reference: 'Juízes 6:1–24', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%206%3A1-24&version=ARC', note: 'Opressão, clamor, profeta, lagar, Anjo do Senhor, oferta e altar da paz.' },
  { title: 'O altar e Joás', reference: 'Juízes 6:25–32', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%206%3A25-32&version=ARC', note: 'Gideão age à noite com dez servos. Joás responde à ameaça dos moradores.' },
  { title: 'A convocação e os sinais', reference: 'Juízes 6:33–40', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%206%3A33-40&version=ARC', note: 'O Espírito do Senhor reveste Gideão. Os sinais da lã são acontecimentos narrativos.' },
  { title: 'De 32.000 a 300', reference: 'Juízes 7:1–8', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%207%3A1-8&version=ARC', note: '22.000 retornam; ficam 10.000. Junto às águas permanecem 300. A libertação pertence ao Senhor.' },
  { title: 'Purá e o sonho', reference: 'Juízes 7:9–15', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%207%3A9-15&version=ARC', note: 'Reconhecimento, sonho do pão de cevada, interpretação e adoração de Gideão.' },
  { title: 'Trombetas, cântaros e tochas', reference: 'Juízes 7:16–25', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%207%3A16-25&version=ARC', note: 'Três companhias. O Senhor causa a confusão. As tribos participam da perseguição.' },
  { title: 'A vitória e a advertência', reference: 'Juízes 8', url: 'https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%208&version=ARC', note: 'Conflitos posteriores, recusa da realeza, éfode como armadilha e o retorno de Israel à idolatria.' },
];

export const npcDialogues: Record<string, DialogueLine[]> = {
  joas: [{ speaker: 'Joás · fala ficcional', text: 'As casas guardam pouco trigo. O medo alcançou cada família. Não confie só na força de seus braços.' }],
  comerciante: [{ speaker: 'Mercador · personagem ficcional', text: 'Posso trocar mantimentos e proteções. Tempos difíceis exigem repartir o que ainda temos.' }],
  servos: [{ speaker: 'Servo · fala ficcional', text: 'Somos dez. Iremos juntos ao altar quando você estiver pronto.' }],
  poste: [{ speaker: 'Narrador', text: 'O poste-ídolo junto ao altar será cortado conforme a ordem recebida. A missão prossegue no altar, com os dez servos.' }],
  armeiro: [{ speaker: 'Armeiro · personagem ficcional', text: 'Confira o couro, a empunhadura e as provisões. Técnicas custam vigor; uma boa defesa permite recuperá-lo.' }],
  mirante: [{ speaker: 'Israelita · personagem ficcional', text: 'Do outro lado do vale, as fogueiras parecem incontáveis. Nosso grupo é pequeno; a promessa do Senhor é nossa esperança.' }],
  pura: [{ speaker: 'Purá · fala ficcional', text: 'Siga junto às rochas. Na sombra das coberturas, as sentinelas terão mais dificuldade para perceber você.' }],
};

export const optionalQuest = {
  id: 'trigo-guardado', title: 'O pouco que restou', targetId: 'celeiro',
  description: 'Converse com a moradora e proteja a trilha dos campos.',
  adaptation: 'Missão secundária ficcional, situada no contexto da fome de Juízes 6.',
};

export default campaign;
