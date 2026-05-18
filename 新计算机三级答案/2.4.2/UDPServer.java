import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.net.SocketException;

public class UDPServer {
    public static void main(String[] args) throws IOException {
        System.out.println("这里是服务端，等待接收客户端信息。。。");
        DatagramSocket datagramSocket = new DatagramSocket(new InetSocketAddress("127.0.0.1",8000));
        // 创建接收缓冲区
        byte[] data = new byte[4096];
        DatagramPacket packet = new DatagramPacket(data,0,data.length);

        while (true){
            datagramSocket.receive(packet);
            int len = packet.getLength();
            String receivedData = new String(data,0,len);
            System.out.println("服务器已接收到消息："+receivedData);
        }
    }
}
