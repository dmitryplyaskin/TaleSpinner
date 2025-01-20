import { $sidebars, changeSidebarSettings, SidebarName } from '@model/sidebars';
import { useUnit } from 'effector-react';
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerBody } from './chakra-core-ui/drawer';
import { Flex, Heading, IconButton } from '@chakra-ui/react';
import { CloseButton } from './chakra-core-ui/close-button';
import { LuArrowRightToLine, LuArrowLeftToLine, LuFullscreen } from 'react-icons/lu';

type Props = {
	name: SidebarName;
	title: string;
	children: React.ReactNode;
	defaultSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
	defaultPlacement?: 'start' | 'end' | 'top' | 'bottom';
	contained?: boolean;
};

export const Drawer: React.FC<Props> = ({ name, title, children }) => {
	const {
		[name]: { isOpen, isFullscreen, placement, size, contained },
	} = useUnit($sidebars);
	const handleClose = () => {
		changeSidebarSettings({ name, settings: { isOpen: false } });
	};

	if (!isOpen) return null;

	return (
		<DrawerRoot
			open={isOpen}
			placement={placement}
			size={isFullscreen ? 'full' : size}
			contained={contained}
			onOpenChange={handleClose}
		>
			<DrawerContent>
				<DrawerHeader>
					<Flex justify="space-between" align="center">
						<Heading size="md">{title}</Heading>
						<Flex gap={2}>
							<IconButton
								onClick={() => changeSidebarSettings({ name, settings: { isFullscreen: !isFullscreen } })}
								variant={isFullscreen ? 'solid' : 'ghost'}
							>
								<LuFullscreen />
							</IconButton>
							<IconButton
								onClick={() =>
									changeSidebarSettings({ name, settings: { placement: placement === 'start' ? 'end' : 'start' } })
								}
								variant="ghost"
							>
								{placement === 'start' ? <LuArrowRightToLine /> : <LuArrowLeftToLine />}
							</IconButton>

							<CloseButton onClick={handleClose} />
						</Flex>
					</Flex>
				</DrawerHeader>

				<DrawerBody>{children}</DrawerBody>
			</DrawerContent>
		</DrawerRoot>
	);
};
