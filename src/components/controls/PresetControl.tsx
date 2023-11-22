"use client";

import * as kits from "@/lib/kits";
import { Kit, Preset, Sequences } from "@/types/types";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaFolderOpen } from "react-icons/fa";
import { IoShareSharp } from "react-icons/io5";
import { IoMdArrowDropdown } from "react-icons/io";
import { RxReset } from "react-icons/rx";
import { useEffect, useState } from "react";
import { polaroid_bounce } from "@/lib/presets/polaroid_bounce";
import { init } from "@/lib/presets/init";
import { a_drum_called_haus } from "@/lib/presets/a_drum_called_haus";
import { rich_kids } from "@/lib/presets/rich_kids";
import { slime_time } from "@/lib/presets/slime_time";
import { purple_haus } from "@/lib/presets/purple_haus";
import { together_again } from "@/lib/presets/together_again";
import { amsterdam } from "@/lib/presets/amsterdam";
import { sunflower } from "@/lib/presets/sunflower";
import { welcome_to_the_haus } from "@/lib/presets/welcome_to_the_haus";
import { super_dream_haus } from "@/lib/presets/super_dream_haus";

type PresetControlProps = {
  preset: Preset;
  setPreset: React.Dispatch<React.SetStateAction<Preset>>;
  kit: Kit;
  setKit: React.Dispatch<React.SetStateAction<Kit>>;
  bpm: number;
  swing: number;
  lowPass: number;
  hiPass: number;
  phaser: number;
  reverb: number;
  compThreshold: number;
  compRatio: number;
  masterVolume: number;
  sequences: Sequences;
  attacks: number[];
  releases: number[];
  filters: number[];
  volumes: number[];
  pans: number[];
  solos: boolean[];
  mutes: boolean[];
  chain: number;
  isPlaying: boolean;
  togglePlay: () => Promise<void>;
};

export const PresetControl: React.FC<PresetControlProps> = ({
  preset,
  setPreset,
  kit,
  setKit,
  bpm,
  swing,
  lowPass,
  hiPass,
  phaser,
  reverb,
  compThreshold,
  compRatio,
  masterVolume,
  sequences,
  attacks,
  releases,
  filters,
  volumes,
  pans,
  solos,
  mutes,
  chain,
  isPlaying,
  togglePlay,
}) => {
  const kitOptions: (() => Kit)[] = [
    kits.drumhaus,
    kits.eighties,
    kits.funk,
    kits.indie,
    kits.jungle,
    kits.organic,
    kits.rnb,
    kits.tech_house,
    kits.techno,
    kits.trap,
  ];

  const _presetOptions: (() => Preset)[] = [
    init,
    welcome_to_the_haus,
    a_drum_called_haus,
    polaroid_bounce,
    rich_kids,
    slime_time,
    purple_haus,
    together_again,
    amsterdam,
    sunflower,
    super_dream_haus,
  ];

  const [selectedKit, setSelectedKit] = useState<string>(kit.name);
  const [selectedPreset, setSelectedPreset] = useState<string>(preset.name);
  const [presetOptions, setPresetOptions] =
    useState<(() => Preset)[]>(_presetOptions);
  const [cleanPreset, setCleanPreset] = useState<Preset>(preset);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  const createPresetFunction = (name: string) => () => ({
    name: name,
    _kit: {
      name: kit.name,
      samples: kit.samples,
      _attacks: attacks,
      _releases: releases,
      _filters: filters,
      _pans: pans,
      _volumes: volumes,
      _mutes: mutes,
      _solos: solos,
    },
    _sequences: sequences,
    _variation: 0,
    _chain: chain,
    _bpm: bpm,
    _swing: swing,
    _lowPass: lowPass,
    _hiPass: hiPass,
    _phaser: phaser,
    _reverb: reverb,
    _compThreshold: compThreshold,
    _compRatio: compRatio,
    _masterVolume: masterVolume,
  });

  const updateStatesOnPresetChange = (
    presetToSave: Preset,
    functionToSave?: () => Preset
  ) => {
    setPreset(presetToSave);
    setCleanPreset(presetToSave);
    setSelectedPreset(presetToSave.name);
    setSelectedKit(presetToSave._kit.name);

    // Add new presets to the list of options (if provided)
    if (functionToSave) {
      setPresetOptions((prevOptions) => [...prevOptions, functionToSave]);
    }
  };

  const stopPlayingOnAction = () => {
    if (isPlaying) {
      togglePlay();
    }
  };

  const handleSave = (customName: string) => {
    const presetFunctionToSave = createPresetFunction(customName);
    const presetToSave = presetFunctionToSave();

    const jsonPreset = JSON.stringify(presetToSave);
    const blob = new Blob([jsonPreset], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = `${customName}.dh`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    updateStatesOnPresetChange(presetToSave, presetFunctionToSave);
  };

  const handleLoad = () => {
    stopPlayingOnAction();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".dh";
    fileInput.onchange = (e) =>
      handleFileChange((e.target as HTMLInputElement).files?.[0]);
    fileInput.click();
  };

  const handleFileChange = (file: File | null | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent: Preset = JSON.parse(e.target?.result as string);
        const presetOption = () => jsonContent;
        updateStatesOnPresetChange(jsonContent, presetOption);
      } catch (error) {
        console.error("Error parsing DH JSON:", error);
      }
    };

    reader.readAsText(file);
  };

  const handleReset = () => {
    stopPlayingOnAction();
    setIsResetModalOpen(false);
    updateStatesOnPresetChange(init());
  };

  const handleShare = async (customName: string) => {
    stopPlayingOnAction();

    const presetFunctionToSave = createPresetFunction(customName);
    const presetToSave = presetFunctionToSave();
    const jsonPreset = JSON.stringify(presetToSave);
    const bpm = presetToSave._bpm.toString();
    const kitUsed = presetToSave._kit.name;

    try {
      const url = new URL("/api/presets", window.location.origin);
      url.searchParams.append("preset_data", jsonPreset);
      url.searchParams.append("custom_name", customName);
      url.searchParams.append("kit_used", kitUsed);
      url.searchParams.append("bpm", bpm);

      const response = await fetch(url.href, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to add preset");
      }

      const { presetKey } = await response.json();

      const _shareableLink = new URL("/", window.location.origin);
      _shareableLink.searchParams.append("preset", presetKey);

      navigator.clipboard.writeText(_shareableLink.href);
      setShareableLink(_shareableLink.href);

      setIsSharedModalOpen(true);
    } catch (error) {
      console.error("Error adding preset:", error);
    }
  };

  const handleKitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    stopPlayingOnAction();

    const selectedKitName = event.target.value;
    const kitOption = kitOptions.find((kit) => kit().name == selectedKitName);

    if (kitOption) {
      const newKit = kitOption();
      setKit(newKit);
      setSelectedKit(newKit.name);
    } else {
      console.error(
        `Kit ${selectedKitName} not found in options: ${kitOptions}`
      );
    }
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const closeSharingModal = () => {
    setIsSharingModalOpen(false);
  };

  const closeSharedModal = () => {
    setIsSharedModalOpen(false);
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    stopPlayingOnAction();

    // Deep equality check between current states and cached preset states
    const cp = cleanPreset;
    const changesMade =
      kit.name !== cp._kit.name ||
      !attacks.every((v, i) => v == cp._kit._attacks[i]) ||
      !releases.every((v, i) => v == cp._kit._releases[i]) ||
      !filters.every((v, i) => v == cp._kit._filters[i]) ||
      !volumes.every((v, i) => v == cp._kit._volumes[i]) ||
      !pans.every((v, i) => v == cp._kit._pans[i]) ||
      !releases.every((v, i) => v == cp._kit._releases[i]) ||
      bpm !== cp._bpm ||
      swing !== cp._swing ||
      lowPass !== cp._lowPass ||
      hiPass !== cp._hiPass ||
      phaser !== cp._phaser ||
      reverb !== cp._reverb ||
      compThreshold !== cp._compThreshold ||
      compRatio !== cp._compRatio ||
      masterVolume !== cp._masterVolume ||
      sequences !== cp._sequences ||
      chain !== cp._chain;

    let isConfirmed = true;
    if (changesMade) {
      isConfirmed = window.confirm(
        "Are you sure you want to switch to a new preset? You will lose any unsaved work on the current preset."
      );
    }

    if (isConfirmed) {
      const selectedPresetName = event.target.value;
      const presetOption = presetOptions.find(
        (preset) => preset().name === selectedPresetName
      );

      if (presetOption) {
        const newPreset = presetOption();
        updateStatesOnPresetChange(newPreset);
      }
    }
  };

  useEffect(() => {
    // Add custom presets loaded via URL search params
    if (!presetOptions.some((option) => option().name == preset.name)) {
      const presetFunctionToSave = (): Preset => ({
        name: preset.name,
        _kit: {
          name: preset._kit.name,
          samples: preset._kit.samples,
          _attacks: preset._kit._attacks,
          _releases: preset._kit._releases,
          _filters: preset._kit._filters,
          _pans: preset._kit._pans,
          _volumes: preset._kit._volumes,
          _mutes: preset._kit._mutes,
          _solos: preset._kit._solos,
        },
        _sequences: preset._sequences,
        _variation: 0,
        _chain: preset._chain,
        _bpm: preset._bpm,
        _swing: preset._swing,
        _lowPass: preset._lowPass,
        _hiPass: preset._hiPass,
        _phaser: preset._phaser,
        _reverb: preset._reverb,
        _compThreshold: preset._compThreshold,
        _compRatio: preset._compRatio,
        _masterVolume: preset._masterVolume,
      });

      console.log(preset.name);
      console.log(preset._sequences);
      console.log(presetFunctionToSave);

      updateStatesOnPresetChange(preset, presetFunctionToSave);
    }
  }, [preset]);

  return (
    <>
      <Center h="100%">
        <Box
          w="100%"
          h="195px"
          className="neumorphicExtraTall"
          borderRadius="8px"
          p={3}
          position="relative"
        >
          <Box
            w="100%"
            borderRadius="8px"
            boxShadow="0 2px 8px rgba(176, 147, 116, 0.6) inset"
            _hover={{
              "& .icon": {
                fill: "darkorange",
                transition: "all 0.2s ease",
              },
            }}
          >
            <Box h="40px" w="100%" id="kit" mb={4} position="relative">
              <Select
                variant="unstyled"
                border="none"
                outline="none"
                value={selectedKit}
                fontFamily={`'Pixelify Sans Variable', sans-serif`}
                color="gray"
                w="332px"
                h="40px"
                borderRadius="8px"
                cursor="pointer"
                pl={4}
                onChange={handleKitChange}
              >
                {kitOptions.map((kit) => (
                  <option key={kit().name} value={kit().name}>
                    {kit().name}
                  </option>
                ))}
              </Select>

              <Box
                position="absolute"
                h="23px"
                w="15px"
                right={3}
                top={2}
                bg="silver"
                pointerEvents="none"
              />

              <Button
                bg="transparent"
                position="absolute"
                right={0}
                top={0}
                pointerEvents="none"
              >
                <Box>
                  <Box h="50%" transform="rotate(180deg)" mb={-1}>
                    <IoMdArrowDropdown className="icon" color="#B09374" />
                  </Box>
                  <Box h="50%">
                    <IoMdArrowDropdown className="icon" color="#B09374" />
                  </Box>
                </Box>
              </Button>
            </Box>
          </Box>

          <Text fontSize={12} color="gray" my={-3}>
            KIT
          </Text>

          <Box
            w="100%"
            borderRadius="8px"
            boxShadow="0 2px 8px rgba(176, 147, 116, 0.6) inset"
            _hover={{
              "& .icon": {
                fill: "darkorange",
                transition: "all 0.2s ease",
              },
            }}
          >
            <Box id="preset" h="40px" mt={4} mb={4} position="relative">
              <Select
                variant="unstyled"
                value={selectedPreset}
                fontFamily={`'Pixelify Sans Variable', sans-serif`}
                color="gray"
                w="332px"
                h="40px"
                borderRadius="8px"
                cursor="pointer"
                onChange={handlePresetChange}
                pl={4}
              >
                {presetOptions.map((preset) => (
                  <option key={preset().name} value={preset().name}>
                    {preset().name}
                  </option>
                ))}
              </Select>

              <Box
                position="absolute"
                h="23px"
                w="15px"
                right={3}
                top={2}
                bg="silver"
                pointerEvents="none"
              />

              <Button
                bg="transparent"
                position="absolute"
                right={0}
                top={0}
                pointerEvents="none"
              >
                <Box>
                  <Box h="50%" transform="rotate(180deg)" mb={-1}>
                    <IoMdArrowDropdown className="icon" color="#B09374" />
                  </Box>
                  <Box h="50%">
                    <IoMdArrowDropdown className="icon" color="#B09374" />
                  </Box>
                </Box>
              </Button>
            </Box>
          </Box>

          <Text fontSize={12} color="gray" my={-3} mb={-1}>
            PRESET
          </Text>

          <Grid
            templateColumns="repeat(4, 1fr)"
            className="neumorphic"
            borderRadius="8px"
            mt={2}
          >
            <GridItem>
              <Center>
                <Tooltip label="Download to file" color="darkorange">
                  <Button
                    onClick={() => setIsSaveModalOpen(true)}
                    w="100%"
                    borderRadius="8px 0 0 8px"
                    className="raised"
                    _hover={{
                      "& .icon": {
                        fill: "darkorange",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <MdOutlineSaveAlt
                      className="icon"
                      color="#B09374"
                      size="20px"
                    />
                  </Button>
                </Tooltip>
              </Center>
            </GridItem>
            <GridItem>
              <Center>
                <Tooltip label="Load from file" color="darkorange">
                  <Button
                    onClick={handleLoad}
                    w="100%"
                    borderRadius="0 0 0 0"
                    className="raised"
                    _hover={{
                      "& .icon": {
                        fill: "darkorange",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <FaFolderOpen
                      className="icon"
                      color="#B09374"
                      size="20px"
                    />
                  </Button>
                </Tooltip>
              </Center>
            </GridItem>
            <GridItem>
              <Center>
                <Tooltip label="Share as link" color="darkorange">
                  <Button
                    onClick={() => setIsSharingModalOpen(true)}
                    w="100%"
                    borderRadius="0 0 0 0"
                    className="raised"
                    _hover={{
                      "& .icon": {
                        fill: "darkorange",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <IoShareSharp
                      className="icon"
                      fill="#B09374"
                      transition="all 0.2s ease"
                      size="20px"
                    />
                  </Button>
                </Tooltip>
              </Center>
            </GridItem>
            <GridItem>
              <Center>
                <Tooltip label="Reset all" color="darkorange">
                  <Button
                    onClick={() => setIsResetModalOpen(true)}
                    w="100%"
                    borderRadius="0 8px 8px 0"
                    className="raised"
                    _hover={{
                      "& .iconReset": {
                        color: "#ff7b00",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <RxReset
                      className="iconReset"
                      color="#B09374"
                      transition="all 0.2s ease"
                      size="20px"
                    />
                  </Button>
                </Tooltip>
              </Center>
            </GridItem>
          </Grid>
        </Box>
      </Center>

      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={closeSaveModal}
        onSave={handleSave}
      />
      <SharingModal
        isOpen={isSharingModalOpen}
        onClose={closeSharingModal}
        onShare={handleShare}
      />
      <ShareModal
        isOpen={isSharedModalOpen}
        onClose={closeSharedModal}
        shareableLink={shareableLink}
      />
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        onReset={handleReset}
      />
    </>
  );
};

const ShareModal: React.FC<any> = ({ isOpen, onClose, shareableLink }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent bg="silver">
        <ModalHeader>Shareable Link</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text pb={6} color="gray">
            Success! Your preset has been saved to the cloud and can be shared
            using this link:
          </Text>
          <Box
            w="100%"
            h="40px"
            borderRadius="8px"
            boxShadow="0 2px 8px rgba(176, 147, 116, 0.6) inset"
          >
            <Center h="100%" pl={4}>
              <Text w="100%">{shareableLink}</Text>
            </Center>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="orange" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SaveModal: React.FC<any> = ({ isOpen, onClose, onSave }) => {
  const [presetName, setPresetName] = useState("");

  const handleSave = () => {
    // Pass the presetName to the onSave function
    onSave(presetName);
    onClose(); // Close the modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="silver">
        <ModalHeader color="brown">Download</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text pb={6} color="gray">
            To download your preset, enter a custom preset name.
          </Text>
          <FormControl>
            <FormLabel color="gray">NAME</FormLabel>
            <Box
              w="80%"
              h="40px"
              borderRadius="8px"
              boxShadow="0 2px 8px rgba(176, 147, 116, 0.6) inset"
            >
              <Center h="100%" pl={4}>
                <Input
                  color="gray"
                  fontFamily={`'Pixelify Sans Variable', sans-serif`}
                  h="100%"
                  w="100%"
                  variant="unstyled"
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
              </Center>
            </Box>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleSave} colorScheme="orange" mr={3}>
            Download
          </Button>
          <Button onClick={onClose} color="gray">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SharingModal: React.FC<any> = ({ isOpen, onClose, onShare }) => {
  const [presetName, setPresetName] = useState("");

  const handleShare = () => {
    // Pass the presetName to the onSave function
    onShare(presetName);
    onClose(); // Close the modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="silver">
        <ModalHeader color="brown">Share Preset</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text pb={2} color="gray">
            Drumhaus can generate a link for you to share all of your creations
            with your friends.
          </Text>
          <Text pb={6} color="gray">
            You can give your preset a custom title by entering it in the form
            below.
          </Text>
          <FormControl>
            <FormLabel color="gray">PRESET NAME</FormLabel>
            <Box
              w="80%"
              h="40px"
              borderRadius="8px"
              boxShadow="0 2px 8px rgba(176, 147, 116, 0.6) inset"
            >
              <Center h="100%" pl={4}>
                <Input
                  color="gray"
                  fontFamily={`'Pixelify Sans Variable', sans-serif`}
                  h="100%"
                  w="100%"
                  variant="unstyled"
                  placeholder="Your custom preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
              </Center>
            </Box>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleShare} colorScheme="orange" mr={3}>
            Get Link
          </Button>
          <Button onClick={onClose} color="gray">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ResetModal: React.FC<any> = ({ isOpen, onClose, onReset }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="silver">
        <ModalHeader color="brown">Reset All</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text pb={2} color="gray">
            Are you sure you want to reset all instruments and audio parameters
            to their initialized settings?
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onReset} colorScheme="orange" mr={3}>
            Reset
          </Button>
          <Button onClick={onClose} color="gray">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
