"use client";

import * as init from "@/lib/init";
import { Preset, Sample, Sequences } from "@/types/types";
import { Box, Button, Center, Grid, GridItem, Heading } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone/build/esm/index";
import { Sequencer } from "./Sequencer";
import { SlotsGrid } from "./SlotsGrid";
import { IoPlaySharp, IoPauseSharp } from "react-icons/io5";
import { TransportControl } from "./TransportControl";
import {
  Knob,
  transformKnobValue,
  transformKnobValueExponential,
} from "./Knob";
import { SequencerControl } from "./SequencerControl";
import { MasterFX } from "./MasterFX";

const Drumhaus = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState(0); // 0 - 15
  const [slotIndex, setSlotIndex] = useState<number>(0); // 0-7

  // Global
  const [preset, setPreset] = useState<Preset>({
    _samples: init._samples,
    _bpm: init._bpm,
    _swing: init._swing,
    _lowPass: init._lowPass,
    _hiPass: init._hiPass,
    _phaser: init._phaser,
    _reverb: init._reverb,
    _masterVolume: init._masterVolume,
    _sequences: init._sequences,
    _attacks: init._attacks,
    _releases: init._releases,
    _filters: init._filters,
    _volumes: init._volumes,
    _pans: init._pans,
    _solos: init._solos,
    _mutes: init._mutes,
    _variation: init._variation,
    _chain: init._chain,
  });

  const [samples, setSamples] = useState<Sample[]>(preset._samples);
  const [sequences, setSequences] = useState<Sequences>(preset._sequences);
  const [variation, setVariation] = useState<number>(preset._variation); // A = 0, B = 1
  const [chain, setChain] = useState<number>(preset._chain); // A = 0, B = 1, AB = 2, AAAB = 3
  const [currentSequence, setCurrentSequence] = useState<boolean[]>(
    preset._sequences[slotIndex][variation][0]
  );

  const [bpm, setBpm] = useState(preset._bpm);
  const [swing, setSwing] = useState(preset._swing);
  const [lowPass, setLowPass] = useState(preset._lowPass);
  const [hiPass, setHiPass] = useState(preset._hiPass);
  const [phaser, setPhaser] = useState(preset._phaser);
  const [reverb, setReverb] = useState(preset._reverb);
  const [masterVolume, setMasterVolume] = useState(preset._masterVolume);

  // Slots - prop drilling (consider Redux in the future)
  const [attacks, setAttacks] = useState<number[]>(preset._attacks);
  const [releases, setReleases] = useState<number[]>(preset._releases);
  const [filters, setFilters] = useState<number[]>(preset._filters);
  const [volumes, setVolumes] = useState<number[]>(preset._volumes);
  const [pans, setPans] = useState<number[]>(preset._pans);
  const [durations, setDurations] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const toneSequence = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    function setPreset(_preset: Preset) {
      setSamples(_preset._samples);
      setSequences(_preset._sequences);
      setCurrentSequence(_preset._sequences[0][0][0]);
      setBpm(_preset._bpm);
      setSwing(_preset._swing);
      setMasterVolume(_preset._masterVolume);
      setAttacks(_preset._attacks);
      setReleases(_preset._releases);
      setFilters(_preset._filters);
      setVolumes(_preset._volumes);
      setPans(_preset._pans);
      setDurations([0, 0, 0, 0, 0, 0, 0, 0]);
      setVariation(_preset._variation);
      setChain(_preset._chain);
    }

    setPreset(preset);
  }, [preset]);

  useEffect(() => {
    let bar = 0;
    let chainVariation = 0;

    if (isPlaying) {
      toneSequence.current = new Tone.Sequence(
        (time, step: number) => {
          function triggerSample(slot: number, velocity: number) {
            samples[slot].sampler.triggerRelease("C2", time);
            if (samples[slot].name !== "OHat") {
              samples[slot].sampler.triggerRelease("C2", time);
              samples[slot].envelope.triggerAttack(time);
              samples[slot].envelope.triggerRelease(
                time + transformKnobValue(releases[slot], [0, durations[slot]])
              );
              samples[slot].sampler.triggerAttack("C2", time, velocity);
            } else {
              triggerOHat(velocity);
            }
          }

          function muteOHatOnHat(slot: number) {
            if (slot == 4) samples[5].sampler.triggerRelease("C2", time);
          }

          function triggerOHat(velocity: number) {
            samples[5].envelope.triggerAttack(time);
            samples[5].sampler.triggerAttack("C2", time, velocity);
          }

          setVariationByChainAndBar();

          for (let slot = 0; slot < sequences.length; slot++) {
            const hit: boolean = sequences[slot][chainVariation][0][step];
            if (hit) {
              const velocity: number = sequences[slot][chainVariation][1][step];
              muteOHatOnHat(slot);
              triggerSample(slot, velocity);
            }
          }

          setStepIndex(step);
          setBarByChain();

          // For current chain, reset bar counter
          function setBarByChain() {
            if (step === 15) {
              if (
                chain < 2 ||
                (chain === 2 && bar === 1) ||
                (chain === 3 && bar === 3)
              ) {
                bar = 0;
              } else {
                bar++;
              }
            }
          }

          // Set the chain variation depending on the bar
          function setVariationByChainAndBar() {
            if (step === 0) {
              switch (chain) {
                case 0:
                  chainVariation = 0;
                  break;
                case 1:
                  chainVariation = 1;
                  break;
                case 2:
                  chainVariation = bar === 0 ? 0 : 1;
                  break;
                case 3:
                  chainVariation = bar === 3 ? 1 : 0;
                  break;
                default:
                  chainVariation = 0;
              }
            }
          }
        },
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        "16n"
      ).start(0);
    }

    return () => {
      toneSequence.current?.dispose();
    };
    // Prop drilling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequences, isPlaying, releases, chain]);

  useEffect(() => {
    const playViaSpacebar = (event: KeyboardEvent) => {
      if (event.key === " ") togglePlay();
    };

    document.addEventListener("keydown", playViaSpacebar);

    return () => {
      document.removeEventListener("keydown", playViaSpacebar);
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const newSwing = transformKnobValue(swing, [0, 0.5]);
    Tone.Transport.swingSubdivision = "16n";
    Tone.Transport.swing = newSwing;
  }, [swing]);

  const toneLPFilter = useRef<Tone.Filter>();
  const toneHPFilter = useRef<Tone.Filter>();
  const tonePhaser = useRef<Tone.Phaser>();
  const toneReverb = useRef<Tone.Reverb>();

  useEffect(() => {
    setMasterChain();

    return () => {
      toneLPFilter.current?.dispose();
      toneHPFilter.current?.dispose();
    };

    function setMasterChain() {
      toneLPFilter.current = new Tone.Filter(15000, "lowpass");
      toneHPFilter.current = new Tone.Filter(0, "highpass");
      tonePhaser.current = new Tone.Phaser({
        frequency: 5,
        octaves: 4,
        baseFrequency: 1000,
      });
      toneReverb.current = new Tone.Reverb(1);

      if (
        toneLPFilter.current &&
        toneHPFilter.current &&
        tonePhaser.current &&
        toneReverb.current
      ) {
        samples.forEach((sample) => {
          sample.sampler.chain(
            sample.envelope,
            sample.filter,
            sample.panner,
            toneLPFilter.current!!,
            toneHPFilter.current!!,
            tonePhaser.current!!,
            toneReverb.current!!,
            Tone.Destination
          );
        });
      }
    }
  }, [samples]);

  useEffect(() => {
    const newLowPass = transformKnobValueExponential(lowPass, [0, 15000]);
    if (toneLPFilter.current) {
      toneLPFilter.current.frequency.value = newLowPass;
    }
  }, [lowPass]);

  useEffect(() => {
    const newHiPass = transformKnobValueExponential(hiPass, [0, 15000]);
    if (toneHPFilter.current) {
      toneHPFilter.current.frequency.value = newHiPass;
    }
  }, [hiPass]);

  useEffect(() => {
    const newPhaserWet = transformKnobValue(phaser, [0, 1]);
    if (tonePhaser.current) {
      tonePhaser.current.wet.value = newPhaserWet;
    }
  }, [phaser]);

  useEffect(() => {
    const newReverbWet = transformKnobValue(reverb, [0, 0.5]);
    const newReverbDecay = transformKnobValue(reverb, [0.1, 3]);
    if (toneReverb.current) {
      toneReverb.current.wet.value = newReverbWet;
      toneReverb.current.decay = newReverbDecay;
    }
  }, [reverb]);

  useEffect(() => {
    const newMasterVolume = transformKnobValue(masterVolume, [-46, 4]);
    Tone.Destination.volume.value = newMasterVolume;
  }, [masterVolume]);

  useEffect(() => {
    const newCurrentSequence: boolean[] = sequences[slotIndex][variation][0];
    setCurrentSequence(newCurrentSequence);
    // Prop drilling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variation]);

  const togglePlay = async () => {
    await Tone.start();

    setIsPlaying((prevIsPlaying) => {
      if (!prevIsPlaying) Tone.Transport.start();
      else Tone.Transport.stop();
      return !prevIsPlaying;
    });
  };

  return (
    <Box
      id="Drumhaus"
      className="drumhaus"
      bg="silver"
      minW={1538}
      w={1538}
      style={{ userSelect: "none" }}
      borderRadius="12px"
    >
      <Box boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)">
        <Heading
          id="logo"
          variant="logo"
          as="h1"
          fontSize={100}
          color="darkorange"
          fontFamily="Mandala"
          px={6}
        >
          drumhaus
        </Heading>
      </Box>

      <Box boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)">
        <SlotsGrid
          samples={samples}
          variation={variation}
          sequences={sequences}
          setCurrentSequence={setCurrentSequence}
          slotIndex={slotIndex}
          setSlotIndex={setSlotIndex}
          attacks={attacks}
          setAttacks={setAttacks}
          releases={releases}
          setReleases={setReleases}
          filters={filters}
          setFilters={setFilters}
          volumes={volumes}
          setVolumes={setVolumes}
          pans={pans}
          setPans={setPans}
          setDurations={setDurations}
        />
      </Box>

      <Grid templateColumns="repeat(5, 1fr)" p={4} w="100%">
        <GridItem colSpan={1} w="160px">
          <Center w="100%" h="100%">
            <Button
              h="140px"
              w="140px"
              onClick={() => togglePlay()}
              boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
              bg="silver"
              outline="none"
            >
              {isPlaying ? (
                <IoPauseSharp size={50} color="darkorange" />
              ) : (
                <IoPlaySharp size={50} color="darkorange" />
              )}
            </Button>
          </Center>
        </GridItem>

        <GridItem colSpan={1}>
          <SequencerControl
            variation={variation}
            setVariation={setVariation}
            chain={chain}
            setChain={setChain}
            currentSequence={currentSequence}
            setCurrentSequence={setCurrentSequence}
            slot={slotIndex}
            sequences={sequences}
            setSequences={setSequences}
          />
        </GridItem>

        <GridItem colSpan={1}>
          <TransportControl
            bpm={bpm}
            setBpm={setBpm}
            swing={swing}
            setSwing={setSwing}
          />
        </GridItem>
        <GridItem colSpan={1} w={120}>
          <MasterFX
            lowPass={lowPass}
            setLowPass={setLowPass}
            hiPass={hiPass}
            setHiPass={setHiPass}
            phaser={phaser}
            setPhaser={setPhaser}
            reverb={reverb}
            setReverb={setReverb}
          />
        </GridItem>
        <GridItem colSpan={1} w={140}>
          <Knob
            size={140}
            knobValue={masterVolume}
            setKnobValue={setMasterVolume}
            knobTitle="MASTER VOLUME"
            knobTransformRange={[-46, 4]}
            knobUnits="dB"
          />
        </GridItem>
      </Grid>

      <Box p={8} boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)">
        <Sequencer
          sequence={currentSequence}
          setSequence={setCurrentSequence}
          sequences={sequences}
          setSequences={setSequences}
          variation={variation}
          slot={slotIndex}
          step={stepIndex}
          isPlaying={isPlaying}
        />
      </Box>
    </Box>
  );
};

export default Drumhaus;
