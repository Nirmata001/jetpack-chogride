/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CharacterDef } from '../types/game';
import { CHARACTERS } from '../game/constants';

interface TheStashShopProps {
  playerCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  selectedCharacter: CharacterDef;
  onSelectCharacter: (char: CharacterDef) => void;
  onLaunchGame: () => void;
}

export const TheStashShop: React.FC<TheStashShopProps> = ({
  playerCoins,
  onUpdateCoins,
  selectedCharacter,
  onSelectCharacter,
  onLaunchGame,
}) => {
  const [activeTab, setActiveTab] = useState<'jetpacks' | 'costumes' | 'gadgets' | 'vehicles'>('jetpacks');
  const [tokens, setTokens] = useState<number>(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winBanner, setWinBanner] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>(['unicorn', 'barry']);

  const [reelIcons, setReelIcons] = useState<[string, string, string]>(['favorite', 'paid', 'rocket']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleBuyOrEquip = (char: CharacterDef, cost: number) => {
    const isOwned = ownedItems.includes(char.id);

    if (isOwned) {
      onSelectCharacter(char);
      showToast(`Equipped ${char.name}! Ready for action! 🚀`);
      return;
    }

    if (playerCoins >= cost) {
      onUpdateCoins(playerCoins - cost);
      setOwnedItems([...ownedItems, char.id]);
      onSelectCharacter(char);
      showToast(`Purchased & Equipped ${char.name}! Wheee! ⚡`);
    } else {
      showToast('Not enough shiny coins! Fly more runs in the lab! 💰');
    }
  };

  const handleSpin = () => {
    if (tokens <= 0) {
      showToast('Out of tokens! Grab more in daily missions!');
      return;
    }
    if (isSpinning) return;

    setTokens((prev) => prev - 1);
    setIsSpinning(true);
    setWinBanner(null);

    const icons = ['favorite', 'paid', 'rocket_launch', 'bolt', 'stars', 'savings'];

    setTimeout(() => {
      const i1 = icons[Math.floor(Math.random() * icons.length)];
      const i2 = icons[Math.floor(Math.random() * icons.length)];
      const i3 = icons[Math.floor(Math.random() * icons.length)];
      setReelIcons([i1, i2, i3]);

      const wonCoins = 1000;
      onUpdateCoins(playerCoins + wonCoins);
      setWinBanner('🎉 YOU WON 1,000 COINS!');
      setIsSpinning(false);
      showToast('🎰 LUCKY MATCH! +1,000 Coins added to Vault!');
    }, 850);
  };

  const shopItems = [
    {
      id: 'unicorn',
      name: 'Rainbow Unicorn',
      cost: 0,
      char: CHARACTERS.find((c) => c.id === 'unicorn') || CHARACTERS[0],
      tag: 'LEGENDARY',
      desc: 'Shoots sparkling rainbow stars and sweet cotton candy puffs that slow down zappers!',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa8xj48YOsPLhy1QyzC9RSPJO8YRDf-TIg7SFxdZ3M2_1-r4pgS3_qOdJ2iC8_Qs6IQ__gCJUwhae9VL7DENzMNzJyLMYsKFKkmwaAxCB_WkKZvHYENLPh16l6glaZ4kqjb-iy9Lw8C-5UsVIs2oQxG6rHpBw7ZZhMPM2oUf2LTS-lG9ZwjEajKhmO7piSQICrNve4jAcVkVOcOy8UTHjkTYd0hEJkPrRa9YbjTlo',
    },
    {
      id: 'bubble',
      name: 'Bubble Blaster 3000',
      cost: 12000,
      char: CHARACTERS.find((c) => c.id === 'bubble') || CHARACTERS[0],
      tag: 'POPULAR',
      desc: 'Blasts giant soapy bubbles that capture nearby scientists and bounce off hazards!',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD27yb0CxxprLBhUPsQDxSaID8bnA_Iy5eJryoPfcTIkzSR6yMpCKZ4wnXgOgST9igkgh5tUz_gzM1Ov8gvy07yFlGXeAs4uYHJo2UOG0P3JqbPG55j9YQpUqudFc_FkZRetL_E5mdYDqYTxAp1zCNBkzNLPa8GPPWp0bXVfYDT8jM0yquzOhrHaP3k6NAjmX8rBTxa6C2tR64KxPqw9JLtBotKCgx45gyRQt6Skjg',
    },
    {
      id: 'barry',
      name: 'Piggy Bank Rocket',
      cost: 25000,
      char: CHARACTERS.find((c) => c.id === 'barry') || CHARACTERS[0],
      tag: 'COIN BOOST',
      desc: 'Snorts shiny pennies that double your coin multiplier during high-speed runs!',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNBIFBaqqYmpxvmUwqUzF8tsLxVAkTtlpkvmJLTzSmiqr-QjNfzvcM89RD-SJ-uS25C77TbErCdFl_b38S9lbuhNIhrIL02ZtLc66jPmHadHtCq5GJdrmzLkDTL-_aw6liJeohOy3JCjQFJd7jkE9iPcLmRdcWqQLJRyu6BoRtdLXBfO5VeG47Ncd69Oou6kgWOkPILw0B19Iy6miAw8F5dpxpD6BM0z4a2FbJ1QA',
    },
    {
      id: 'dragon',
      name: 'Dragon Firecracker',
      cost: 40000,
      char: CHARACTERS.find((c) => c.id === 'dragon') || CHARACTERS[0],
      tag: 'HOT!',
      desc: 'Fires yummy warm popcorn blasts that vaporize incoming missiles automatically!',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5O50tVUFBAt9f2CgBFp9tgKlbFG33MLoVxNfwVgXtmx-byOvhw-dE5fotIjy_SueZtjvARG4fjY9L13WwitZT8I0b75z2Cy09oO9gFNs_wbNaUvp1Ir31x9wkPdJT01R0XMUSl1PNxBtx57FtCmC9TTKOYQjiDT9sDppMGIE-cOhNPXpv6VcpuRLYF6YMa2ZBfrNS9C8kBGtY76cB3suag8HSH2svJFqvAwai6Ss',
    },
    {
      id: 'cyber_ninja',
      name: 'Laser Shark Pack',
      cost: 60000,
      char: CHARACTERS.find((c) => c.id === 'cyber_ninja') || CHARACTERS[0],
      tag: 'LASER TECH',
      desc: 'Chomps through obstacles with funny laser beam sneezes and turbo water propulsion.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2fzwIHUxbeegTbxjNmPM-DbmHwwe9xtjKZ1zeglAuh6AWzr_YhMZzyFSpnjsq6XvxqL9siXSgLQ8lvywZzNbK7M0QmSfVmjzYdaG3KjXteYii5yGh_do20AZ_0-lWAxtnXQchjZG8cHx-W688RhP3v-ORiecGDiPb-Z7-6z2yiOJkHlWyrDBDxsK_w9Wu6ipqOyAAAS3xdPb0RdrZwqmi77Ta4Sn3CSUwwTCxOEY',
    },
    {
      id: 'valkyrie',
      name: 'Candy Cane Thruster',
      cost: 15000,
      char: CHARACTERS.find((c) => c.id === 'valkyrie') || CHARACTERS[0],
      tag: 'SWEET BOOST',
      desc: 'Peppermint turbo stripes leave a trail of sticky sugar that slows red laser grids.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOa97BM5k-zQvqCD1YpdfqGcTCXL7nKmSGRZBQlIf0sYpqOwUuXvPKUADaj4ufrxHvepv3BmT4ROdWoHS7VpvN5BHA14_SNUEYGkJ6wfz_mTmBw6bKjv2-vd2WuzoX8nXt7I7GEXIhuOvc0-qNmnAD4ScXCSlkmHCeDMXjjsoSyBgg2OpvPNa9iH_RKDZh_KIh9yyg8cr3w7K-yExPUORc9v09KMvZDNVCtC1HTtk',
    },
  ];

  return (
    <div className="flex flex-col w-full relative pb-12 select-none font-body">
      {/* SHOP TOP HERO & BANNER */}
      <section className="relative w-full overflow-hidden bg-[#f7f3e8] px-6 py-8 border-b-2 border-[#d0c6ab]/60">
        {/* Polka Dot Pattern Canvas */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#ecc200 2.5px, transparent 2.5px), radial-gradient(#00d2ff 2.5px, #f7f3e8 2.5px)',
            backgroundSize: '28px 28px',
            backgroundPosition: '0 0, 14px 14px',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          {/* Bouncy Banner Pill Container */}
          <div className="inline-flex items-center gap-3 bg-[#ffd319] text-[#705b00] px-8 py-2.5 rounded-full shadow-[0_6px_0_#ecc200] transform -rotate-1 hover:rotate-0 transition-transform">
            <span className="material-symbols-outlined text-3xl animate-bounce">redeem</span>
            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-wider drop-shadow-sm text-[#231b00]">
              WELCOME TO THE STASH!
            </h1>
            <span className="material-symbols-outlined text-3xl animate-bounce">stars</span>
          </div>
          <p className="font-body text-base text-[#4d4632] mt-3 max-w-2xl font-medium">
            Squishy gadgets, crazy thrusters, and super-silly costumes! Spend your shiny coins and try before you fly!
          </p>

          {/* Currency Ribbons Cluster */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {/* Gold Coin Bank Pill */}
            <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full shadow-[0_4px_0_#d0c6ab] hover:scale-105 transition-all">
              <div className="w-10 h-10 rounded-full bg-[#ffd319] text-[#705b00] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl font-bold">paid</span>
              </div>
              <div className="flex flex-col text-left pr-2">
                <span className="text-[11px] text-[#725c00] uppercase font-bold tracking-wider leading-tight">
                  Coin Vault
                </span>
                <span className="font-headline text-xl text-[#1c1c15] font-extrabold leading-tight">
                  {playerCoins.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => onUpdateCoins(playerCoins + 5000)}
                className="w-7 h-7 rounded-full bg-[#725c00] text-white flex items-center justify-center text-sm font-bold shadow-[0_2px_0_#564500] hover:scale-110 active:translate-y-0.5 cursor-pointer"
                title="Add Free Coins!"
                type="button"
              >
                +
              </button>
            </div>

            {/* Gem Pouch Pill */}
            <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full shadow-[0_4px_0_#d0c6ab] hover:scale-105 transition-all">
              <div className="w-10 h-10 rounded-full bg-[#b6ebff] text-[#001f28] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl">diamond</span>
              </div>
              <div className="flex flex-col text-left pr-2">
                <span className="text-[11px] text-[#00677f] uppercase font-bold tracking-wider leading-tight">
                  Shiny Gems
                </span>
                <span className="font-headline text-xl text-[#1c1c15] font-extrabold leading-tight">
                  85
                </span>
              </div>
            </div>

            {/* Spin Tokens Ribbon */}
            <div className="flex items-center gap-2 bg-[#ffd9e1] text-[#3f001c] px-5 py-2 rounded-full shadow-[0_4px_0_#ffb1c6] hover:scale-105 transition-all">
              <div className="w-10 h-10 rounded-full bg-[#b90360] text-white flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl">confirmation_number</span>
              </div>
              <div className="flex flex-col text-left pr-2">
                <span className="text-[11px] text-[#b90360] uppercase font-bold tracking-wider leading-tight">
                  Spin Tokens
                </span>
                <span className="font-headline text-xl text-[#3f001c] font-extrabold leading-tight">
                  {tokens}
                </span>
              </div>
              <span className="text-xs bg-[#b90360] text-white px-2.5 py-0.5 rounded-full uppercase font-bold">
                Free Roll
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY SELECTOR TABS */}
      <section className="max-w-7xl mx-auto w-full px-6 -mt-5 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-1.5 bg-[#f1eee3] rounded-3xl shadow-[0_4px_16px_rgba(114,92,0,0.08)] border-2 border-[#d0c6ab]">
          <button
            onClick={() => setActiveTab('jetpacks')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-headline text-lg font-bold transition-all cursor-pointer ${
              activeTab === 'jetpacks'
                ? 'bg-[#ffd319] text-[#231b00] shadow-[0_4px_0_#ecc200]'
                : 'bg-white text-[#4d4632] hover:bg-[#ece8dd] shadow-[0_4px_0_#d0c6ab]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            <span>JETPACKS</span>
          </button>

          <button
            onClick={() => setActiveTab('costumes')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-headline text-lg font-bold transition-all cursor-pointer ${
              activeTab === 'costumes'
                ? 'bg-[#ffd319] text-[#231b00] shadow-[0_4px_0_#ecc200]'
                : 'bg-white text-[#4d4632] hover:bg-[#ece8dd] shadow-[0_4px_0_#d0c6ab]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl text-[#b90360]">styler</span>
            <span>COSTUMES</span>
          </button>

          <button
            onClick={() => setActiveTab('gadgets')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-headline text-lg font-bold transition-all cursor-pointer ${
              activeTab === 'gadgets'
                ? 'bg-[#ffd319] text-[#231b00] shadow-[0_4px_0_#ecc200]'
                : 'bg-white text-[#4d4632] hover:bg-[#ece8dd] shadow-[0_4px_0_#d0c6ab]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl text-[#00677f]">bolt</span>
            <span>GADGETS</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-headline text-lg font-bold transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-[#ffd319] text-[#231b00] shadow-[0_4px_0_#ecc200]'
                : 'bg-white text-[#4d4632] hover:bg-[#ece8dd] shadow-[0_4px_0_#d0c6ab]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl text-[#725c00]">cruelty_free</span>
            <span>VEHICLES</span>
          </button>
        </div>
      </section>

      {/* MAIN SHOPPING PLAYGROUND (3-Column Layout from Template) */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: HERO DRESSING ROOM & TEST LAB STAGE (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-3xl p-5 shadow-[0_6px_0_#d0c6ab] border-2 border-[#d0c6ab] relative overflow-hidden flex flex-col items-center text-center">
            {/* Floating Badge */}
            <div className="absolute top-3 left-3 bg-[#b6ebff] text-[#001f28] px-3 py-1 rounded-full text-xs font-bold font-body flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">science</span>
              <span>FITTING LAB</span>
            </div>

            <div className="w-full flex justify-end">
              <button
                onClick={() => showToast('Swapped Fitting Angle! 📐')}
                className="text-[#4d4632] hover:text-[#b90360] transition-colors cursor-pointer"
                title="Rotate avatar"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">360</span>
              </button>
            </div>

            {/* 3D Pedestal Display */}
            <div className="relative w-48 h-56 mt-2 flex items-center justify-center">
              <div className="absolute bottom-2 w-44 h-14 bg-[#f1eee3] rounded-full shadow-[inset_0_4px_8px_rgba(114,92,0,0.15)] flex items-center justify-center">
                <div className="w-36 h-9 bg-[#ffd319]/40 rounded-full animate-pulse" />
              </div>
              <img
                className="relative z-10 w-44 h-48 object-contain transform hover:scale-105 transition-transform"
                alt="Cartoon pilot in fitting room"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhiVSYl8K-TrNMozieFZu9cuDOi50RJ0sIzMO9rIPDZFONj7e8S59FkEA5pD5dSbbX24FXZVXvweLufhIqyspWtqYMIz8B7iNIwR9zPWjNcq-Ck11RNsNfMBNFlHaNjVs3NA93lFDq-J8_tgLK9x2vBv-9DX2qISq0g9NLDXl1zPmUk3BSXbASes33ieKm9m7HRhEjunSzxvKk7HV3MsGeBfSj4omM54AZ4Ulclg4"
              />
            </div>

            {/* Equipped Jetpack Banner */}
            <div className="w-full bg-[#ece8dd] rounded-2xl p-2.5 mt-2">
              <span className="text-[11px] text-[#725c00] uppercase font-bold block">
                Currently Wearing:
              </span>
              <p className="font-headline text-lg font-extrabold text-[#1c1c15] leading-tight">
                {selectedCharacter.name.toUpperCase()}
              </p>
            </div>

            {/* Candy Bar Stat Meters */}
            <div className="w-full flex flex-col gap-3 mt-4 text-left">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1c1c15]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#b90360] text-sm">sports_gymnastics</span>
                    Bounciness
                  </span>
                  <span className="text-[#b90360]">95%</span>
                </div>
                <div className="w-full h-3 bg-[#f1eee3] rounded-full overflow-hidden mt-1 p-0.5">
                  <div
                    className="h-full bg-[#ffc9d7] rounded-full shadow-[0_0_8px_rgba(185,3,96,0.5)] transition-all duration-500"
                    style={{ width: '95%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#1c1c15]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#725c00] text-sm">attractions</span>
                    Coin Magnet
                  </span>
                  <span className="text-[#725c00]">80%</span>
                </div>
                <div className="w-full h-3 bg-[#f1eee3] rounded-full overflow-hidden mt-1 p-0.5">
                  <div
                    className="h-full bg-[#ffd319] rounded-full shadow-[0_0_8px_rgba(255,211,25,0.6)] transition-all duration-500"
                    style={{ width: '80%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#1c1c15]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#00677f] text-sm">mood</span>
                    Silliness Factor
                  </span>
                  <span className="text-[#00677f]">100%</span>
                </div>
                <div className="w-full h-3 bg-[#f1eee3] rounded-full overflow-hidden mt-1 p-0.5">
                  <div
                    className="h-full bg-[#00d2ff] rounded-full shadow-[0_0_8px_rgba(0,210,255,0.6)] transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Big Test Flight Button */}
            <button
              onClick={onLaunchGame}
              className="mt-5 w-full py-3 px-4 rounded-2xl bg-[#b6ebff] text-[#001f28] font-headline text-lg font-bold shadow-[0_5px_0_#47d6ff] active:translate-y-1 hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-2xl animate-spin">cyclone</span>
              <span>TEST FLY LAB!</span>
            </button>
          </div>

          <div className="bg-[#f1eee3] rounded-2xl p-4 flex items-center gap-3 border border-[#d0c6ab]">
            <span className="material-symbols-outlined text-[#725c00] text-3xl">lightbulb</span>
            <p className="text-xs text-[#4d4632] font-medium leading-relaxed">
              Tip: Gadgets can be combined with any Jetpack for super-powered combos!
            </p>
          </div>
        </aside>

        {/* CENTER PANEL: FEATURED JETPACKS TOY BOX GRID (6 cols) */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#725c00] text-3xl">toys</span>
              <h2 className="font-headline text-2xl font-bold text-[#1c1c15]">CRAZY JETPACK AISLE</h2>
            </div>
            <span className="text-xs bg-[#f1eee3] px-3 py-1 rounded-full text-[#4d4632] font-bold">
              {shopItems.length} Items In Stock
            </span>
          </div>

          {/* Toy Box Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.map((item) => {
              const isEquipped = selectedCharacter.id === item.id;
              const isOwned = ownedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 shadow-[0_6px_0_#d0c6ab] border-2 border-[#d0c6ab] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform"
                >
                  {/* Ribbon Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 shadow-sm ${
                      isEquipped
                        ? 'bg-[#ffd319] text-[#705b00]'
                        : item.tag === 'HOT!'
                        ? 'bg-[#ffd9e1] text-[#3f001c]'
                        : 'bg-[#b6ebff] text-[#001f28]'
                    }`}
                  >
                    {isEquipped && <span className="material-symbols-outlined text-xs">check_circle</span>}
                    <span>{isEquipped ? 'EQUIPPED' : item.tag}</span>
                  </div>

                  <div>
                    <div className="w-full h-36 bg-[#f7f3e8] rounded-2xl flex items-center justify-center p-2 mb-3 relative overflow-hidden">
                      <img
                        className="h-28 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                        alt={item.name}
                        src={item.img}
                      />
                    </div>
                    <h3 className="font-headline text-lg font-bold text-[#1c1c15]">{item.name}</h3>
                    <p className="text-xs text-[#4d4632] mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 flex items-center justify-between border-t border-[#f1eee3]">
                    <div className="flex items-center gap-1 font-headline text-lg text-[#1c1c15] font-extrabold">
                      {item.cost > 0 && !isOwned ? (
                        <>
                          <span className="material-symbols-outlined text-[#ffd319] text-xl">paid</span>
                          <span>{item.cost.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold">UNLOCKED</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBuyOrEquip(item.char, item.cost)}
                      className={`py-2 px-5 rounded-xl font-headline text-base font-bold shadow-[0_4px_0_#ecc200] active:translate-y-1 transition-all cursor-pointer ${
                        isEquipped
                          ? 'bg-[#ece8dd] text-[#7f7660] cursor-default shadow-none'
                          : isOwned
                          ? 'bg-[#b6ebff] text-[#001f28] shadow-[0_4px_0_#47d6ff]'
                          : 'bg-[#ffd319] text-[#705b00]'
                      }`}
                      type="button"
                    >
                      {isEquipped ? 'IN USE' : isOwned ? 'EQUIP!' : 'BUY!'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT PANEL: LUCKY ARCADE GUMBALL & SPIN MACHINE (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-3xl p-5 shadow-[0_6px_0_#d0c6ab] border-2 border-[#d0c6ab] flex flex-col items-center text-center relative overflow-hidden">
            {/* Carnival Header */}
            <div className="w-full bg-[#b90360] text-white py-2 px-3 rounded-2xl shadow-[0_4px_0_#8e0048] flex items-center justify-center gap-1.5 font-headline font-bold text-lg">
              <span className="material-symbols-outlined text-xl animate-spin">casino</span>
              <span>LUCKY SPIN</span>
            </div>
            <p className="text-xs text-[#4d4632] mt-2 font-medium">
              Match 3 prize badges to win legendary jackpot prizes!
            </p>

            {/* Gumball / Slot Machine Reels */}
            <div className="w-full mt-4 bg-[#f1eee3] rounded-3xl p-3 shadow-inner flex flex-col items-center">
              <div className="w-full bg-white rounded-2xl p-2 shadow-inner grid grid-cols-3 gap-2 border-2 border-[#e6e2d8]">
                {reelIcons.map((icon, idx) => (
                  <div
                    key={idx}
                    className={`h-20 bg-[#f7f3e8] rounded-xl flex flex-col items-center justify-center transition-transform duration-300 ${
                      isSpinning ? 'scale-90 opacity-70 animate-pulse' : ''
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-3xl ${
                        icon === 'favorite' ? 'text-[#b90360]' : icon === 'paid' ? 'text-[#ffd319]' : 'text-[#00d2ff]'
                      }`}
                    >
                      {icon}
                    </span>
                    <span className="text-[10px] font-bold text-[#1c1c15] uppercase mt-1">
                      {icon === 'favorite' ? 'REVIVE' : icon === 'paid' ? '1,000 G' : 'BOOST'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dispenser Slot */}
              <div className="w-28 h-3.5 bg-[#31312a] rounded-full mt-3 flex items-center justify-center">
                <div className="w-20 h-1 bg-[#f1eee3] rounded-full opacity-50" />
              </div>
              <span className="text-[10px] text-[#7f7660] mt-1 uppercase font-bold">Prize Dispenser</span>
            </div>

            {/* Pull Lever Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || tokens <= 0}
              className={`mt-4 w-full py-3.5 px-4 rounded-2xl bg-[#b90360] text-white font-headline text-lg font-bold shadow-[0_6px_0_#8e0048] active:translate-y-1.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSpinning || tokens <= 0 ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-2xl">hardware</span>
              <span>{isSpinning ? 'SPINNING...' : 'PULL TO SPIN!'}</span>
            </button>
            <span className="text-xs text-[#4d4632] mt-1.5 font-bold">Cost: 1 Spin Token</span>

            {/* Win Notice */}
            {winBanner && (
              <div className="w-full mt-3 bg-[#ffd319] text-[#705b00] p-2 rounded-xl font-headline font-bold text-sm text-center animate-bounce">
                {winBanner}
              </div>
            )}

            {/* Prize Table Card */}
            <div className="w-full mt-4 bg-[#f7f3e8] rounded-2xl p-3 text-left text-xs border border-[#d0c6ab]">
              <span className="text-[11px] text-[#725c00] uppercase font-bold block mb-1">
                Arcade Loot Table:
              </span>
              <ul className="text-[#4d4632] space-y-1 font-medium">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#b90360]">favorite</span>
                    3x Hearts
                  </span>
                  <span className="font-bold text-[#1c1c15]">Full Shield</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#ffd319]">paid</span>
                    3x Coins
                  </span>
                  <span className="font-bold text-[#1c1c15]">+5,000 G</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#00677f]">rocket</span>
                    3x Boosters
                  </span>
                  <span className="font-bold text-[#1c1c15]">Super Blast</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mystery Chest Banner */}
          <div className="bg-gradient-to-r from-[#ffe07c] to-[#b6ebff] rounded-3xl p-4 shadow-[0_4px_0_#d0c6ab] flex items-center gap-3 border-2 border-[#d0c6ab]">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[#725c00] text-3xl">savings</span>
            </div>
            <div>
              <h4 className="font-headline text-base font-bold text-[#1c1c15] leading-tight">
                Daily Mystery Chest!
              </h4>
              <p className="text-xs text-[#4d4632] font-medium">Unlocks free tokens every 6 hours.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM FLOATING TOY CHEST NOTIFICATION / SNACKBAR */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#31312a] text-[#f4f1e6] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[#ffd319] text-2xl">check_circle</span>
          <span className="font-headline text-base font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
